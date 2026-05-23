import express, { Request, Response, NextFunction } from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { DB, parseToken, generateToken } from "./src/server-db.js"; // note the standard node layout

// Load environment variables
dotenv.config();

// Initialize the Express router and app
const app = express();
app.use(express.json());

const PORT = 3000;

// Extend Express Request type to include auth user context
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
      };
    }
  }
}

// -------------------------------------------------------------
// Authentication Middleware
// -------------------------------------------------------------
function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Access denied. Private workspace. Please login." });
    return;
  }

  const token = authHeader.substring(7);
  const userId = parseToken(token);
  if (!userId) {
    res.status(401).json({ error: "Your session has expired or token is invalid. Please login again." });
    return;
  }

  const user = DB.findUserById(userId);
  if (!user) {
    res.status(401).json({ error: "Author account profile no longer exists." });
    return;
  }

  // Bind onto request context
  req.user = {
    id: user.id,
    email: user.email,
    name: user.name,
  };
  next();
}

// -------------------------------------------------------------
// Public Endpoints: Readers / Landing Page Blog Roll
// -------------------------------------------------------------

// Fetch published posts
app.get("/api/posts", (req: Request, res: Response) => {
  try {
    const { tag, search } = req.query;
    let posts = DB.getPublishedPosts();

    if (tag) {
      const tagStr = String(tag).toLowerCase().trim();
      posts = posts.filter((p) => p.tags.some((t) => t.toLowerCase() === tagStr));
    }

    if (search) {
      const searchStr = String(search).toLowerCase().trim();
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(searchStr) ||
          p.summary.toLowerCase().includes(searchStr) ||
          p.content.toLowerCase().includes(searchStr)
      );
    }

    res.json(posts);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to render articles data list" });
  }
});

// Fetch detailed published post by slug
app.get("/api/posts/:slug", (req: Request, res: Response) => {
  try {
    const post = DB.getPostBySlug(req.params.slug);
    if (!post || post.status !== "published") {
      res.status(404).json({ error: "Detailed article is not found or is in draft status." });
      return;
    }

    // Determine viewport device for telemetry parsing
    const userAgent = req.headers["user-agent"] || "";
    let device: "desktop" | "mobile" | "tablet" = "desktop";
    if (/Mobi|Android|iPhone/i.test(userAgent)) {
      device = "mobile";
    } else if (/Tablet|iPad/i.test(userAgent)) {
      device = "tablet";
    }

    // Incremental log view
    DB.trackEvent("view", post.id, undefined, userAgent, device);

    res.json(post);
  } catch (err: any) {
    res.status(500).json({ error: "Article retrieval error" });
  }
});

// Client trigger analytics track (e.g. share click)
app.post("/api/analytics/track", (req: Request, res: Response) => {
  try {
    const { type, postId, sharePlatform, device } = req.body;
    if (!["view", "share", "signup"].includes(type)) {
      res.status(400).json({ error: "Invalid tracking event type" });
      return;
    }

    DB.trackEvent(type, postId, sharePlatform, req.headers["user-agent"], device);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Telemetry failed" });
  }
});

// Email newsletter signup form
app.post("/api/newsletter/subscribe", async (req: Request, res: Response) => {
  try {
    const { email, sourcePostId } = req.body;
    if (!email || !email.includes("@")) {
      res.status(400).json({ error: "Please enter a valid email address." });
      return;
    }

    const result = DB.addSubscriber(email, sourcePostId);
    const integrations = DB.getIntegrations();

    // Simulated Sendgrid / Mailchimp delivery log representation
    let integrationStatus = "local";
    let logs: string[] = [];

    if (integrations.mailchimpEnabled && integrations.mailchimpApiKey) {
      integrationStatus = "Mailchimp Queue Sync Executed (Simulated)";
      logs.push(`[MC] Adding ${email} to Audience ID ${integrations.mailchimpAudienceId}`);
    }
    if (integrations.sendgridEnabled && integrations.sendgridApiKey) {
      integrationStatus = integrations.mailchimpEnabled ? "Mailchimp + SendGrid Triggered" : "SendGrid Triggered";
      logs.push(`[SG] Delivering welcome auto-newsletter notification from '${integrations.sendgridSenderEmail}' to '${email}'`);
    }

    res.json({
      success: true,
      message: result.alreadyExists
        ? "You've already signed up! We appreciate your ongoing subscription."
        : "Thank you! You've successfully subscribed to our weekly design and tech digest.",
      integration: {
        status: integrationStatus,
        logs
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: "Subscription pipeline error" });
  }
});

// -------------------------------------------------------------
// User Authentication Endpoints
// -------------------------------------------------------------

app.post("/api/auth/register", (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: "Full workspace registration fields required." });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Secure passwords require at least 6 characters." });
      return;
    }

    const existingUser = DB.findUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: "Writer workspace account with this email is already registered." });
      return;
    }

    const newUser = DB.createUser(name, email, password);
    const token = generateToken(newUser.id);

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch {
    res.status(500).json({ error: "Register pipeline error" });
  }
});

app.post("/api/auth/login", (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Author credentials values required." });
      return;
    }

    const user = DB.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: "Invalid account email or workspace password match." });
      return;
    }

    const passwordHash = DB.getUsers().find(u => u.id === user.id)?.passwordHash;
    const { hashPassword } = require("./src/server-db.js");
    if (passwordHash !== hashPassword(password)) {
      res.status(401).json({ error: "Invalid account email or workspace password match." });
      return;
    }

    const token = generateToken(user.id);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch {
    res.status(500).json({ error: "Login pipeline error" });
  }
});

app.get("/api/auth/me", requireAuth, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

// -------------------------------------------------------------
// Admin Workspace Endpoints (Auth Required)
// -------------------------------------------------------------

// Read all administrative articles (drafts + published)
app.get("/api/admin/posts", requireAuth, (req: Request, res: Response) => {
  try {
    const posts = DB.getPosts().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(posts);
  } catch {
    res.status(500).json({ error: "Workspace error loading administrative workspace drafts" });
  }
});

app.get("/api/admin/posts/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const post = DB.getPostById(req.params.id);
    if (!post) {
      res.status(404).json({ error: "Target workspace post draft is not found" });
      return;
    }
    res.json(post);
  } catch {
    res.status(500).json({ error: "Request error" });
  }
});

// Create article draft
app.post("/api/admin/posts", requireAuth, (req: Request, res: Response) => {
  try {
    const { title, content, tags, summary, status } = req.body;
    if (!title) {
      res.status(400).json({ error: "An appealing title is required before drafting." });
      return;
    }

    const newPost = DB.createPost(
      req.user!.id,
      req.user!.name,
      title,
      content || "",
      tags || [],
      summary || "",
      status || "draft"
    );

    res.status(201).json(newPost);
  } catch {
    res.status(500).json({ error: "Draft creation error" });
  }
});

// Update article contents
app.put("/api/admin/posts/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const updated = DB.updatePost(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: "Post item is not found inside writing database" });
      return;
    }
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Update action error" });
  }
});

// Remove article from db
app.delete("/api/admin/posts/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const success = DB.deletePost(req.params.id);
    if (!success) {
      res.status(404).json({ error: "Post is not found" });
      return;
    }
    res.json({ success: true, message: "Draft removed securely from writing catalog" });
  } catch {
    res.status(500).json({ error: "Removal pipeline error" });
  }
});

// Real-time Analytics Dashboard stats aggregation
app.get("/api/admin/analytics/dashboard", requireAuth, (req: Request, res: Response) => {
  try {
    const events = DB.getAnalytics();
    const posts = DB.getPosts();
    const subscribers = DB.getSubscribers();

    // 1. Total Metrics
    const totalViews = events.filter((e) => e.type === "view").length;
    const totalShares = events.filter((e) => e.type === "share").length;
    const totalSubscribers = subscribers.length;

    // Calculate aggregated charts for past 7 days (Daily Views, Daily Shares, Daily Newsletter Signups)
    const dailyData: Record<string, { date: string; views: number; shares: number; signups: number }> = {};
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const friendlyDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyData[dateKey] = { date: friendlyDate, views: 0, shares: 0, signups: 0 };
    }

    events.forEach((evt) => {
      const dateKey = evt.timestamp.split("T")[0];
      if (dailyData[dateKey]) {
        if (evt.type === "view") dailyData[dateKey].views++;
        else if (evt.type === "share") dailyData[dateKey].shares++;
        else if (evt.type === "signup") dailyData[dateKey].signups++;
      }
    });

    const dailyTimeline = Object.values(dailyData);

    // 2. Share platform distribution
    const sharePlatforms: Record<string, number> = { twitter: 0, facebook: 0, linkedin: 0, clipboard: 0 };
    events.forEach((evt) => {
      if (evt.type === "share" && evt.sharePlatform) {
        sharePlatforms[evt.sharePlatform] = (sharePlatforms[evt.sharePlatform] || 0) + 1;
      }
    });
    const platformData = Object.entries(sharePlatforms).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));

    // 3. User Devices distribution
    const devices: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    events.forEach((evt) => {
      if (evt.device) {
        devices[evt.device] = (devices[evt.device] || 0) + 1;
      }
    });
    const deviceData = Object.entries(devices).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));

    // 4. Top Articles list (by view counts)
    const topPosts = posts
      .map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        status: p.status,
        views: p.views || 0,
        shares: events.filter((e) => e.type === "share" && e.postId === p.id).length
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // 5. Engagement Metrics list
    const totalNewsletterClicks = events.filter((e) => e.type === "signup").length;

    res.json({
      totals: {
        views: totalViews,
        shares: totalShares,
        subscribers: totalSubscribers,
        conversionRate: totalViews > 0 ? Number(((totalSubscribers / totalViews) * 100).toFixed(1)) : 0
      },
      dailyTimeline,
      platformData,
      deviceData,
      topPosts
    });
  } catch {
    res.status(500).json({ error: "Failed to assemble analytics metrics context" });
  }
});

// Read subscribers list
app.get("/api/admin/subscribers", requireAuth, (req: Request, res: Response) => {
  try {
    const list = DB.getSubscribers().sort(
      (a, b) => new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime()
    );
    res.json(list);
  } catch {
    res.status(500).json({ error: "Workspace error loading subscribers list" });
  }
});

// Read / Set marketing integration configurations
app.get("/api/admin/integrations", requireAuth, (req: Request, res: Response) => {
  try {
    res.json(DB.getIntegrations());
  } catch {
    res.status(500).json({ error: "Failed to fetch configurations" });
  }
});

app.post("/api/admin/integrations", requireAuth, (req: Request, res: Response) => {
  try {
    const updated = DB.saveIntegrations(req.body);
    res.json({ success: true, data: updated, message: "Campaign marketing settings saved successfully." });
  } catch {
    res.status(500).json({ error: "Failed to update configurations" });
  }
});

// -------------------------------------------------------------
// AI Drafting Assistant with Gemini (Server Side SDK only)
// -------------------------------------------------------------

app.post("/api/gemini/assist", requireAuth, async (req: Request, res: Response) => {
  const { action, prompt, content } = req.body;

  if (!action) {
    res.status(400).json({ error: "Assist action type is required" });
    return;
  }

  // Gracefully handle missing Gemini credentials
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
    res.status(403).json({
      error: "Gemini API Secret Key is not configured yet.",
      hint: "Configure your GEMINI_API_KEY inside the 'Settings > Secrets' panel within the workspace.",
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    let systemInstruction = "You are a professional editorial advisor and copywriter helping draft engaging articles.";
    let finalPrompt = "";

    switch (action) {
      case "proofread":
        systemInstruction = "You are an elite proofreader. Fix spelling, spacing, typos and style of the text while retaining its exact tone. Return the audited text cleanly without explanations.";
        finalPrompt = `Please audit and proofread this writing block:\n\n${content}`;
        break;
      case "generateTags":
        systemInstruction = "Analyze standard markdown text and output a JSON array of 3 top relevant tags. Return strictly JSON data matching: ['Tag1', 'Tag2', 'Tag3']";
        finalPrompt = `Extract optimized single-word category tags for this post content:\n\n${content}`;
        break;
      case "brainstorm":
        systemInstruction = "You are an editorial brainstorm coordinator. Propose 3 alternate title options, a primary content structural outline, and an optimized hook paragraph based on the user's idea.";
        finalPrompt = `Help brainstorm an outline for this post idea/concept:\n\nTheme: ${prompt}\n\nCurrent block if any:\n${content}`;
        break;
      case "expand":
        systemInstruction = "You are an elegant writing collaborator. Expand on the provided section with relevant details, descriptive examples, and rich details. Maintain the flow and vocabulary level of the text.";
        finalPrompt = `Elaborate and expand this section elegantly:\n\n${content}\n\nKey instruction: ${prompt || "Introduce rich facts and expand details"}`;
        break;
      case "summarize":
        systemInstruction = "You are a succinct editorial copywriter. Generate a strong, engaging single-sentence TL;DR summary overview of the provided text. Max 140 characters.";
        finalPrompt = `Summarize this post for a card preview:\n\n${content}`;
        break;
      default:
        finalPrompt = `${prompt}\n\nContent block:\n${content}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: finalPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const output = response.text || "";
    res.json({ result: output });
  } catch (err: any) {
    console.error("Gemini Assistant call error:", err);
    res.status(500).json({ error: `Assistant pipeline failed: ${err.message || "Unknown GenAI Error"}` });
  }
});

// -------------------------------------------------------------
// Vite Dev Client / Production Static Build Pipelines
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Mount Vite development middlewares
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Blog Server] Active on port ${PORT} (http://localhost:${PORT})`);
  });
}

startServer();
