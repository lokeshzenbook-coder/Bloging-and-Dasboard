import fs from "fs";
import path from "path";
import crypto from "crypto";

// File-based simple DB path
const DB_FILE = path.join(process.cwd(), "blog-db.json");

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  tags: string[];
  status: "draft" | "published";
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  views: number;
}

export interface AnalyticsEvent {
  id: string;
  postId?: string;
  type: "view" | "share" | "signup";
  sharePlatform?: "twitter" | "facebook" | "linkedin" | "clipboard";
  timestamp: string; // ISO string
  userAgent?: string;
  device?: "desktop" | "mobile" | "tablet";
}

export interface Subscriber {
  id: string;
  email: string;
  subscribedAt: string;
  source?: string;
}

export interface IntegrationSettings {
  mailchimpEnabled: boolean;
  mailchimpApiKey: string;
  mailchimpAudienceId: string;
  sendgridEnabled: boolean;
  sendgridApiKey: string;
  sendgridSenderEmail: string;
}

export interface DatabaseSchema {
  users: User[];
  posts: Post[];
  analytics: AnalyticsEvent[];
  subscribers: Subscriber[];
  integrations: IntegrationSettings;
}

// Password utility
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Generate secure sessions
export function generateToken(userId: string): string {
  const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return Buffer.from(JSON.stringify({ userId, expiry })).toString("base64");
}

export function parseToken(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    if (payload.expiry < Date.now()) return null;
    return payload.userId;
  } catch {
    return null;
  }
}

// Default state helper
function getDefaultDb(): DatabaseSchema {
  const now = new Date();
  
  // Create default mock admin
  const adminId = "author-1";
  const defaultAdmin: User = {
    id: adminId,
    email: "admin@blog.com",
    name: "Alexander Mercer",
    passwordHash: hashPassword("password123"),
  };

  // Seed standard posts
  const posts: Post[] = [
    {
      id: "post-1",
      title: "Mastering Clean Typography in Modern Web Design",
      slug: "mastering-clean-typography",
      summary: "Explore how typographic pairings, line heights, letter-spacing, and responsive layouts define premium web design experiences.",
      content: `# Mastering Clean Typography in Modern Web Design

Typography is not just about choosing a font; it is the cornerstone of exceptional user experiences. When done right, it establishes hierarchy, conveys an authentic "mood", and significantly reduces cognitive load.

## The Pillars of Elite Typography

### 1. Intentional Font Pairing
Never choose fonts at random. Pair a high-impact display face (such as *Outfit* or *Space Grotesk*) for headlines with a highly legible, neutral sans-serif (like *Inter*) for your body copy. This contrast guides the reader's eye naturally.

### 2. Line Heights & Breathing Room
The default line spacing is often too cramped. Aim for a line height of **1.6x to 1.75x** for body copy. This optimal spacing allows readers to track sentences smoothly without accidentally skipping rows.

### 3. Golden Line Lengths
For desktop readers, keep line width constrained between **45 to 75 characters**. Anything wider tires the eyes, while narrower lines break sentences too abruptly, causing reading rhythm fatigue:

\`\`\`css
/* Maximize readability width in CSS */
article {
  max-width: 65ch;
  margin: 0 auto;
}
\`\`\`

## The Visual Impact of White Space

A premium design relies on generous negative space. Do not cluster your headings directly against paragraphs. Add top margins to headlines to isolate sections beautifully and allow the layout to "breathe".

Let's test dynamic code rendering inside our markdown blog engine:

\`\`\`typescript
interface TypographyProperties {
  family: string;
  weight: number;
  lineHeight: number;
  letterSpacing: string;
}

const bodyFont: TypographyProperties = {
  family: "Inter, sans-serif",
  weight: 400,
  lineHeight: 1.65,
  letterSpacing: "-0.011em"
};
\`\`\`

By mastering these rules, your applications will instantly transcend generic defaults and offer readers premium Comfort and Elegance. Enjoy crafting!`,
      tags: ["Design", "Typography", "CSS"],
      status: "published",
      authorId: adminId,
      authorName: "Alexander Mercer",
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      publishedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      views: 142
    },
    {
      id: "post-2",
      title: "The Rise of Full-Stack AI Coding Assistants",
      slug: "rise-of-ai-coding-assistants",
      summary: "How modern agentic pipelines and code builders are changing the software prototyping landscape, with concrete full-stack examples.",
      content: `# The Rise of Full-Stack AI Coding Assistants

We are living through an unprecedented mutation in software tooling. AI coding assistants are evolving from single-line auto-completers into fully agentic co-developers that can build, verify, compile, and deploy full-stack code.

## From Completion to Collaboration

Traditional coding helpers simply matched snippets. Modern assistants analyze full project trees, manage packages, write express routes, construct state matrices, and solve compilation hurdles autonomously.

> "The true developer increases their leverage by steering AI systems rather than writing boilerplate."

### The Stack of the Future

An AI-optimized stack looks highly modular, with typed boundaries and clean interfaces. Let's see a robust Express server configuration that uses Vite's middleware framework for seamless rapid prototyping:

\`\`\`ts
import express from 'express';
import { createServer } from 'vite';

async function launch() {
  const app = express();
  
  // Mounted backend controllers
  app.get('/api/v1/health', (req, res) => {
    res.json({ live: true, timestamp: Date.now() });
  });

  // Dynamic asset pipelines in dev
  if (process.env.NODE_ENV !== 'production') {
    const viteInstance = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(viteInstance.middlewares);
  }
}
\`\`\`

## Embracing the leverage

To maximize output, developer focus must shift toward:
1. **Architecture & Schema Design**: Designing cleaner database blueprints and API routes.
2. **Component Isolation**: Writing modular pieces to facilitate easy code reviews.
3. **Intentional Guidance**: Providing clear constraints over raw procedural instructions.

As these tools gain agentic maturity, the gap between concept and fully deployed reality shrinks to zero.`,
      tags: ["AI", "Programming", "Fullstack"],
      status: "published",
      authorId: adminId,
      authorName: "Alexander Mercer",
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      views: 95
    },
    {
      id: "post-3",
      title: "Understanding Engagement Metrics: Analytical Design",
      slug: "understanding-engagement-metrics",
      summary: "Delve into key performance indicators for written content. Learn what metrics genuinely drive newsletter signups and direct impact.",
      content: `# Understanding Engagement Metrics: Analytical Design

As creators, we are often overwhelmed by metrics. Page views, click-through rates, scroll depths, bounce rates—their aggregate noise can cloud what actually matters: **genuine human engagement.**

## Vanity Metrics vs. Active Attention

A page view of 5 seconds is practically noise. Instead, we should focus on metrics that represent deep engagement:

1. **Estimated Reading Time (ERT) Match**: Tracking if readers spend time proportional to the word count.
2. **Sharing Actions**: When a reader copies a link or clicks a share icon, it indicates a high level of intellectual validation.
3. **Subscribing Convergency**: The rate at which unique readers convert into email newsletter subscribers.

### Tracking Engagement Cleanly

Here is a simple, lightweight approach to track reader interactions with a clean backend endpoint:

\`\`\`typescript
// Tracking schema representation
interface ReaderActivity {
  postId: string;
  action: "view_start" | "share_click" | "scroll_bottom";
  timeElapsedSeconds: number;
}
\`\`\`

We can compile these events in real-time, providing beautiful dashboards that reflect reader sentiments accurately. Designing interfaces to present this data clearly helps writers tailor their storytelling strategy with confidence.`,
      tags: ["Analytics", "Marketing", "Writing"],
      status: "published",
      authorId: adminId,
      authorName: "Alexander Mercer",
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      views: 67
    },
    {
      id: "post-4",
      title: "Next-Gen CSS Features You Must Adopt",
      slug: "next-gen-css-features",
      summary: "Crafting beautiful layouts in drafting phase using standard modern container queries, nestings, and scroll animations.",
      content: `# Next-Gen CSS Features You Must Adopt

Modern CSS has evolved at a dizzying pace. Traditional pre-processors like Sass or heavy design frames are no longer strictly necessary for advanced behaviors. Let's look at pristine capabilities native to current browsers.

## 1. Grid & Container Queries
Container queries allow elements to style themselves based on their parent container's width, rather than the global viewport width. This makes layout-bento grids incredibly responsive.

\`\`\`css
/* Define modern container tracking */
.bento-card-container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .bento-card {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
}
\`\`\`

## 2. Dynamic Scroll Timelines
Animating content based on the user's scroll depth creates premium, fluid feedback. When paired with delicate fade transitions, your content appears as a living editorial canvas.

Enjoy using these native CSS features on your blog layout!`,
      tags: ["Design", "CSS", "Frontend"],
      status: "draft", // Keeps it as draft so they can test preview/publishing
      authorId: adminId,
      authorName: "Alexander Mercer",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0
    }
  ];

  // Seed analytics events over the last 7 days
  const analytics: AnalyticsEvent[] = [];
  const sharePlatforms: ("twitter" | "facebook" | "linkedin" | "clipboard")[] = ["twitter", "facebook", "linkedin", "clipboard"];
  const devices: ("desktop" | "mobile" | "tablet")[] = ["desktop", "mobile", "tablet"];

  // Core loop to populate realistic records
  for (let d = 7; d >= 0; d--) {
    const dayDate = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
    // Views
    const tempViews = Math.floor(20 + Math.random() * 30);
    for (let j = 0; j < tempViews; j++) {
      const postIdx = Math.floor(Math.random() * 3); // match published ones
      analytics.push({
        id: `view-${d}-${j}`,
        postId: posts[postIdx].id,
        type: "view",
        timestamp: new Date(dayDate.getTime() + Math.random() * 12 * 3600 * 1000).toISOString(),
        device: devices[Math.floor(Math.random() * devices.length)]
      });
    }
    // Shares
    const tempShares = Math.floor(1 + Math.random() * 4);
    for (let k = 0; k < tempShares; k++) {
      analytics.push({
        id: `share-${d}-${k}`,
        postId: posts[Math.floor(Math.random() * 3)].id,
        type: "share",
        sharePlatform: sharePlatforms[Math.floor(Math.random() * sharePlatforms.length)],
        timestamp: new Date(dayDate.getTime() + Math.random() * 12 * 3600 * 1000).toISOString(),
        device: devices[Math.floor(Math.random() * devices.length)]
      });
    }
    // Signups
    if (Math.random() > 0.3) {
      analytics.push({
        id: `signup-${d}`,
        type: "signup",
        timestamp: new Date(dayDate.getTime() + Math.random() * 12 * 3600 * 1000).toISOString(),
        device: devices[Math.floor(Math.random() * devices.length)]
      });
    }
  }

  // Seed subscribers
  const subscribers: Subscriber[] = [
    { id: "sub-1", email: "reader.one@example.com", subscribedAt: new Date(now.getTime() - 6 * 24 * 3600 * 1000).toISOString() },
    { id: "sub-2", email: "tech.expert@example.com", subscribedAt: new Date(now.getTime() - 4 * 24 * 3600 * 1000).toISOString() },
    { id: "sub-3", email: "design.lover@outlook.com", subscribedAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString() },
    { id: "sub-4", email: "digital.scribe@gmail.com", subscribedAt: new Date(now.getTime() - 1 * 24 * 3600 * 1000).toISOString() },
  ];

  // Default integrations settings
  const integrations: IntegrationSettings = {
    mailchimpEnabled: false,
    mailchimpApiKey: "",
    mailchimpAudienceId: "",
    sendgridEnabled: false,
    sendgridApiKey: "",
    sendgridSenderEmail: "newsletter@myblog.com"
  };

  return {
    users: [defaultAdmin],
    posts,
    analytics,
    subscribers,
    integrations
  };
}

// Active database operations helper
export class DB {
  private static data: DatabaseSchema | null = null;

  private static load() {
    if (DB.data) return;
    
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        DB.data = JSON.parse(raw);
      } catch (err) {
        console.error("Error reading database file, resetting to defaults", err);
        DB.data = getDefaultDb();
        DB.save();
      }
    } else {
      DB.data = getDefaultDb();
      DB.save();
    }
  }

  public static save() {
    if (!DB.data) return;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(DB.data, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to writing database to file", err);
    }
  }

  // Users Auth
  public static getUsers(): User[] {
    DB.load();
    return DB.data?.users || [];
  }

  public static findUserByEmail(email: string): User | undefined {
    return DB.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public static findUserById(id: string): User | undefined {
    return DB.getUsers().find((u) => u.id === id);
  }

  public static createUser(name: string, email: string, passwordPlainText: string): User {
    DB.load();
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      passwordHash: hashPassword(passwordPlainText)
    };
    DB.data!.users.push(newUser);
    DB.save();
    return newUser;
  }

  // Posts Control
  public static getPosts(): Post[] {
    DB.load();
    return DB.data?.posts || [];
  }

  public static getPublishedPosts(): Post[] {
    return DB.getPosts()
      .filter((p) => p.status === "published")
      .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
  }

  public static getPostBySlug(slug: string): Post | undefined {
    return DB.getPosts().find((p) => p.slug === slug);
  }

  public static getPostById(id: string): Post | undefined {
    return DB.getPosts().find((p) => p.id === id);
  }

  public static createPost(authorId: string, authorName: string, title: string, content: string, tags: string[], summary: string, status: "draft" | "published"): Post {
    DB.load();
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "") || `post-${Date.now()}`;

    const now = new Date().toISOString();
    const newPost: Post = {
      id: `post-${Date.now()}`,
      title,
      slug,
      content,
      summary: summary || content.slice(0, 150).replace(/[#*`]/g, "") + "...",
      tags: tags.map(t => t.trim().replace("#", "")).filter(Boolean),
      status,
      authorId,
      authorName,
      createdAt: now,
      updatedAt: now,
      publishedAt: status === "published" ? now : undefined,
      views: 0
    };

    DB.data!.posts.push(newPost);
    DB.save();
    return newPost;
  }

  public static updatePost(id: string, updates: Partial<Omit<Post, "id" | "authorId" | "authorName">>): Post | null {
    DB.load();
    const post = DB.data!.posts.find((p) => p.id === id);
    if (!post) return null;

    if (updates.title !== undefined) {
      post.title = updates.title;
      post.slug = updates.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/^-+|-+$/g, "") || `post-${Date.now()}`;
    }

    if (updates.content !== undefined) post.content = updates.content;
    if (updates.summary !== undefined) post.summary = updates.summary;
    if (updates.tags !== undefined) {
      post.tags = updates.tags.map(t => t.trim().replace("#", "")).filter(Boolean);
    }

    if (updates.status !== undefined) {
      if (post.status !== "published" && updates.status === "published") {
        post.publishedAt = new Date().toISOString();
      }
      post.status = updates.status;
    }

    post.updatedAt = new Date().toISOString();
    DB.save();
    return post;
  }

  public static deletePost(id: string): boolean {
    DB.load();
    const index = DB.data!.posts.findIndex((p) => p.id === id);
    if (index === -1) return false;

    DB.data!.posts.splice(index, 1);
    DB.save();
    return true;
  }

  public static incrementView(postId: string) {
    DB.load();
    const post = DB.data!.posts.find((p) => p.id === postId);
    if (post) {
      post.views = (post.views || 0) + 1;
      DB.save();
    }
  }

  // Analytics Logs
  public static trackEvent(type: "view" | "share" | "signup", postId?: string, sharePlatform?: "twitter" | "facebook" | "linkedin" | "clipboard", userAgent?: string, device?: "desktop" | "mobile" | "tablet") {
    DB.load();
    const event: AnalyticsEvent = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      postId,
      type,
      sharePlatform,
      timestamp: new Date().toISOString(),
      userAgent,
      device: device || "desktop"
    };
    DB.data!.analytics.push(event);

    if (type === "view" && postId) {
      DB.incrementView(postId);
    }
    DB.save();
  }

  public static getAnalytics(): AnalyticsEvent[] {
    DB.load();
    return DB.data?.analytics || [];
  }

  // Subscribers Controls
  public static getSubscribers(): Subscriber[] {
    DB.load();
    return DB.data?.subscribers || [];
  }

  public static addSubscriber(email: string, source?: string): { success: boolean; alreadyExists: boolean } {
    DB.load();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return { success: false, alreadyExists: false };

    const exists = DB.data!.subscribers.some((s) => s.email.toLowerCase() === cleanEmail);
    if (exists) {
      return { success: true, alreadyExists: true };
    }

    const newSub: Subscriber = {
      id: `sub-${Date.now()}`,
      email: cleanEmail,
      subscribedAt: new Date().toISOString(),
      source
    };

    DB.data!.subscribers.push(newSub);
    // Track signup analytics event
    DB.trackEvent("signup", undefined, undefined, undefined, "desktop");
    DB.save();
    return { success: true, alreadyExists: false };
  }

  // Integrations Controls
  public static getIntegrations(): IntegrationSettings {
    DB.load();
    return DB.data!.integrations;
  }

  public static saveIntegrations(updates: Partial<IntegrationSettings>): IntegrationSettings {
    DB.load();
    DB.data!.integrations = {
      ...DB.data!.integrations,
      ...updates
    };
    DB.save();
    return DB.data!.integrations;
  }
}
