import React, { useState, useEffect } from "react";
import { Compass, FileText, Plus, BarChart3, Users, LogOut, Loader2, Sparkles, AlertCircle, Edit, ListCollapse, Eye, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReaderView from "./components/ReaderView";
import AuthScreen from "./components/AuthScreen";
import AdminDashboard from "./components/AdminDashboard";
import AdminEditor from "./components/AdminEditor";
import AdminSubscribers from "./components/AdminSubscribers";
import { Post, User, AnalyticsDashboard } from "./types";

type ViewState = "reader" | "auth" | "admin";
type AdminTab = "analytics" | "articles" | "editor" | "subscribers";

export default function App() {
  const [view, setView] = useState<ViewState>("reader");
  const [adminTab, setAdminTab] = useState<AdminTab>("articles");
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark";
  });

  // Client Session Credentials
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem("user_profile");
    return cached ? JSON.parse(cached) : null;
  });

  // Posts State
  const [posts, setPosts] = useState<Post[]>([]);
  const [adminPosts, setAdminPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingAdminPosts, setLoadingAdminPosts] = useState(false);

  // Analytics Dynamic State
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Editor Target State
  const [editingPost, setEditingPost] = useState<Partial<Post> | null>(null);
  const [currentPostSlug, setCurrentPostSlug] = useState<string | null>(null);

  // Application Error/Instruction banners
  const [feedback, setFeedback] = useState("");

  // Manage Dark Mode Class Toggle on Mount
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Read public posts on Mount
  const fetchPublicPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch("/api/posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error("Failed to read published articles:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPublicPosts();
  }, []);

  // Sync admin posts when entering workspace or clicking Tab
  const fetchAdminPosts = async () => {
    if (!token) return;
    setLoadingAdminPosts(true);
    try {
      const res = await fetch("/api/admin/posts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminPosts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAdminPosts(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!token) return;
    setLoadingAnalytics(true);
    try {
      const res = await fetch("/api/admin/analytics/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (view === "admin") {
      fetchAdminPosts();
      fetchAnalytics();
    }
  }, [view, token]);

  // Auth Operations
  const handleAuthSuccess = (newToken: string, authedUser: User) => {
    setToken(newToken);
    setUser(authedUser);
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("user_profile", JSON.stringify(authedUser));
    setView("admin");
    setAdminTab("analytics"); // Enter onto graphs
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_profile");
    setView("reader");
  };

  // Admin Article Management CRUD
  const handleSavePost = async (postData: Partial<Post>) => {
    if (!token) return;

    const method = postData.id ? "PUT" : "POST";
    const url = postData.id ? `/api/admin/posts/${postData.id}` : "/api/admin/posts";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save operation failed.");
      }

      await fetchAdminPosts();
      await fetchPublicPosts(); // refresh public sync state
      setAdminTab("articles");
      setEditingPost(null);
    } catch (err: any) {
      alert(`Save Error: ${err.message}`);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Delete operational error");
      }

      await fetchAdminPosts();
      await fetchPublicPosts();
      setAdminTab("articles");
      setEditingPost(null);
    } catch (err: any) {
      alert(`Removal Error: ${err.message}`);
    }
  };

  const handleCreateNewArticle = () => {
    setEditingPost({
      title: "",
      summary: "",
      content: "",
      tags: [],
      status: "draft",
    });
    setAdminTab("editor");
  };

  const handleEditExistingArticle = (post: Post) => {
    setEditingPost(post);
    setAdminTab("editor");
  };

  return (
    <div className="font-sans antialiased">
      <AnimatePresence mode="wait">
        
        {/* PUBLIC BLOCKED FEED VIEW */}
        {view === "reader" && (
          <motion.div
            key="reader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ReaderView
              posts={posts}
              loading={loadingPosts}
              onGoToAuth={() => setView(token ? "admin" : "auth")}
              isDarkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
              selectedPostSlug={currentPostSlug}
              onSelectPostBySlug={setCurrentPostSlug}
            />
          </motion.div>
        )}

        {/* SECURE CREATOR LOGIN SCREEN */}
        {view === "auth" && (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AuthScreen
              onAuthSuccess={handleAuthSuccess}
              onBackToReader={() => setView("reader")}
            />
          </motion.div>
        )}

        {/* WORKSPACE ADMINISTRATIVE CONTROL PANEL */}
        {view === "admin" && user && (
          <motion.div
            key="admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors"
          >
            {/* Left Nav sidebar */}
            <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between transition-colors">
              <div className="space-y-8">
                {/* Brand Header */}
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-teal-500 flex items-center justify-center text-white text-lg font-serif font-black">
                    M
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">
                      Admin Creator Hub
                    </h2>
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono font-medium block">
                      Active: {user.name}
                    </span>
                  </div>
                </div>

                {/* Switch list */}
                <nav className="space-y-1.5">
                  <button
                    onClick={() => setAdminTab("analytics")}
                    className={`nav-tab w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                      adminTab === "analytics"
                        ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850/50"
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Post Engagement Analytics</span>
                  </button>

                  <button
                    onClick={() => setAdminTab("articles")}
                    className={`nav-tab w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                      adminTab === "articles" || (adminTab === "editor" && !editingPost)
                        ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850/50"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>My Creative Articles</span>
                  </button>

                  <button
                    onClick={handleCreateNewArticle}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide bg-slate-900 border border-slate-950 text-white dark:bg-white dark:text-slate-950 hover:opacity-90 transition-all font-sans"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Draft New Post</span>
                  </button>

                  <button
                    onClick={() => setAdminTab("subscribers")}
                    className={`nav-tab w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                      adminTab === "subscribers"
                        ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850/50"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Newsletter Sync</span>
                  </button>
                </nav>
              </div>

              {/* Sidebar bottom */}
              <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button
                  onClick={() => setView("reader")}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850/50 rounded-lg transition-colors"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Interactive Reader</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </aside>

            {/* Main administrative body space panel */}
            <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto overflow-y-auto">
              <AnimatePresence mode="wait">
                
                {/* METRICS DASHBOARD TABS */}
                {adminTab === "analytics" && (
                  <motion.div
                    key="analytics"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <AdminDashboard
                      stats={analytics}
                      loading={loadingAnalytics}
                      onPostSelectSlug={(slug) => {
                        setCurrentPostSlug(slug);
                        setView("reader");
                      }}
                    />
                  </motion.div>
                )}

                {/* MY ARTICLES CATALOGUE TABS */}
                {adminTab === "articles" && (
                  <motion.div
                    key="articles"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                          My Creative Articles
                        </h2>
                        <span className="text-xs text-slate-400 block mt-0.5">Manage details of both published posts and local drafts.</span>
                      </div>
                      <button
                        onClick={handleCreateNewArticle}
                        className="inline-flex items-center gap-1.5 py-1.5 px-3.5 bg-sky-500 text-white hover:bg-sky-600 text-xs font-bold rounded-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Masterpiece</span>
                      </button>
                    </div>

                    {loadingAdminPosts ? (
                      <div className="flex justify-center items-center py-20">
                        <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-white animate-spin"></div>
                      </div>
                    ) : adminPosts.length > 0 ? (
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 transition-colors overflow-hidden">
                        {adminPosts.map((post) => (
                          <div
                            key={post.id}
                            className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all"
                          >
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                    post.status === "published"
                                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                                  }`}
                                >
                                  {post.status}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </span>
                              </div>
                              <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 truncate">
                                {post.title}
                              </h3>
                              <p className="text-xs text-slate-400 truncate max-w-xl">
                                {post.summary || "No description provided."}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setCurrentPostSlug(post.slug);
                                  setView("reader");
                                }}
                                className="p-2 border border-slate-150 dark:border-slate-800 text-slate-500 hover:text-teal-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-850 rounded-lg transition-colors"
                                title="See Active Public View"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleEditExistingArticle(post)}
                                className="p-2 border border-slate-150 dark:border-slate-800 text-slate-500 hover:text-teal-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-850 rounded-lg transition-colors"
                                title="Edit Post Content"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Permanently delete this writing catalogue?")) {
                                    handleDeletePost(post.id);
                                  }
                                }}
                                className="p-2 border border-red-100 dark:border-red-950/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                                title="Delete Post Draft"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20 border border-dashed rounded-2xl border-slate-200 dark:border-slate-800 transition-colors">
                        <p className="text-sm text-slate-500 font-medium">No writing drafts recorded inside your account db.</p>
                        <button
                          onClick={handleCreateNewArticle}
                          className="mt-3 text-xs font-semibold text-teal-600 hover:underline"
                        >
                          Draft your first masterpiece &rarr;
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* EDITING & WRITING DRAFT TAB AREA */}
                {adminTab === "editor" && editingPost && (
                  <motion.div
                    key="editor"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <AdminEditor
                      post={editingPost}
                      onSave={handleSavePost}
                      onDelete={(id) => handleDeletePost(id)}
                      onBack={() => {
                        setEditingPost(null);
                        setAdminTab("articles");
                      }}
                      authToken={token!}
                    />
                  </motion.div>
                )}

                {/* NEWSLETTER SUBSCRIBERS & GATEWAY SETUP TAB */}
                {adminTab === "subscribers" && (
                  <motion.div
                    key="subscribers"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <AdminSubscribers authToken={token!} />
                  </motion.div>
                )}

              </AnimatePresence>
            </main>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
