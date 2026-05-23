import React, { useState, useEffect } from "react";
import { Search, Moon, Sun, LayoutDashboard, Share2, ArrowRight, CornerDownRight, Check, Copy, Calendar, Clock, Sparkles, Send, Loader2, RefreshCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import { Post } from "../types";

interface ReaderViewProps {
  posts: Post[];
  loading: boolean;
  onGoToAuth: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onSelectPostBySlug: (slug: string) => void;
  selectedPostSlug: string | null;
}

export default function ReaderView({
  posts,
  loading,
  onGoToAuth,
  isDarkMode,
  onToggleDarkMode,
  onSelectPostBySlug,
  selectedPostSlug,
}: ReaderViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [detailedPost, setDetailedPost] = useState<Post | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);

  // Newsletter email sign up states
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsMessage, setNewsMessage] = useState("");
  const [newsError, setNewsError] = useState("");
  const [newsLogs, setNewsLogs] = useState<string[]>([]);
  const [newsStatus, setNewsStatus] = useState("");

  // Social Sharing States
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareFeedback, setShareFeedback] = useState("");

  // Accumulate all unique tags from published posts
  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags)));

  // Fetch detailed article when slug changes
  useEffect(() => {
    if (selectedPostSlug) {
      setLoadingPost(true);
      fetch(`/api/posts/${selectedPostSlug}`)
        .then((res) => {
          if (!res.ok) throw new Error("Article is not accessible");
          return res.json();
        })
        .then((data) => {
          setDetailedPost(data);
        })
        .catch((err) => {
          console.error(err);
          onSelectPostBySlug("");
        })
        .finally(() => {
          setLoadingPost(false);
        });
    } else {
      setDetailedPost(null);
    }
  }, [selectedPostSlug]);

  const handleTrackShare = async (platform: string, postId: string) => {
    try {
      await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "share",
          postId,
          sharePlatform: platform,
          device: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "mobile" : "desktop",
        }),
      });

      setShareFeedback(`Successfully shared to ${platform}! Analytics tracked.`);
      setTimeout(() => setShareFeedback(""), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = (slug: string, postId: string) => {
    const fullUrl = `${window.location.origin}/posts/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    handleTrackShare("clipboard", postId);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsError("");
    setNewsMessage("");
    setNewsLogs([]);
    setNewsStatus("");
    setNewsLoading(true);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newsletterEmail,
          sourcePostId: detailedPost?.id || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete newsletter subscription");
      }

      setNewsMessage(data.message);
      setNewsletterEmail("");

      if (data.integration) {
        setNewsStatus(data.integration.status);
        setNewsLogs(data.integration.logs || []);
      }
    } catch (err: any) {
      setNewsError(err.message || "Subscription service unavailable");
    } finally {
      setNewsLoading(false);
    }
  };

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTag = !selectedTag || post.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());

    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-250">
      
      {/* Editorial Header */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-150 dark:border-slate-850/80 transition-colors">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => onSelectPostBySlug("")}
            className="flex items-center gap-2 group text-left outline-hidden"
          >
            <div className="h-9 w-9 rounded-lg bg-teal-500 flex items-center justify-center text-white font-serif font-bold text-lg select-none group-hover:bg-teal-600 transition-colors">
              M
            </div>
            <div>
              <span className="font-serif italic font-bold tracking-tight text-lg text-slate-900 dark:text-slate-100 block leading-none">
                Mercer's
              </span>
              <span className="text-[10px] tracking-widest font-semibold uppercase text-slate-400 block mt-0.5">
                Design & Logic
              </span>
            </div>
          </button>

          {/* Search bar & utility controls */}
          <div className="flex items-center gap-3">
            {!detailedPost && (
              <div className="relative hidden md:block">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Query topics & keys..."
                  className="w-48 xl:w-60 pl-9 pr-3 py-1.5 bg-slate-100 hover:bg-slate-200/60 dark:bg-slate-900 dark:hover:bg-slate-800 text-xs text-slate-800 dark:text-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:bg-white dark:focus:bg-slate-950 border border-transparent focus:border-slate-200 dark:focus:border-slate-800 transition-all font-mono"
                />
              </div>
            )}

            <button
              onClick={onToggleDarkMode}
              className="p-2 border border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 shadow-xs hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
              title="Toggle comfort theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onGoToAuth}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-white dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200 text-xs font-semibold rounded-md border border-transparent shadow-xs transition-colors cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Workspace</span>
            </button>
          </div>
        </div>
      </header>

      {/* Reader Main Space Grid */}
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <AnimatePresence mode="wait">
          {detailedPost ? (
            // DETAILED POST READER CANVAS
            <motion.div
              key="detailed"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <button
                onClick={() => onSelectPostBySlug("")}
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors group outline-hidden"
              >
                <span>&larr; Back to Articles Catalog</span>
              </button>

              {loadingPost ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin"></div>
                  <p className="text-xs text-slate-400 mt-3 font-mono">Unfolding content block...</p>
                </div>
              ) : (
                <article className="space-y-8">
                  {/* Article Title, Metadata Block */}
                  <div className="space-y-4 pb-6 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400 font-medium">
                      {detailedPost.tags.map((tag) => (
                        <span key={tag} className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200/20 text-slate-500">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
                      {detailedPost.title}
                    </h1>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-400 font-mono">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">By {detailedPost.authorName}</span>
                        <span className="text-slate-300 dark:text-slate-800">|</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(detailedPost.publishedAt || detailedPost.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        <span className="text-slate-300 dark:text-slate-800">|</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.ceil(detailedPost.content.split(" ").length / 225)} min read</span>
                      </div>

                      <div className="flex items-center gap-1 text-slate-500 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 px-2 py-1 rounded">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{detailedPost.views || 1}</span>
                        <span className="text-[10px] uppercase tracking-wider pl-1">VIEWS RECORDED</span>
                      </div>
                    </div>
                  </div>

                  {/* Rich Render Markdown Output */}
                  <div className="markdown-body text-slate-850 dark:text-slate-350 tracking-normal antialiased">
                    <Markdown>{detailedPost.content}</Markdown>
                  </div>

                  {/* Dynamic interactive sharing component bar */}
                  <div className="p-6 border border-slate-120 dark:border-slate-850/80 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Enriched this article? Share with your circles</h4>
                        <p className="text-xs text-slate-400 mt-1">Increase our editorial reach and trace analytics metrics directly on the server.</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleCopyLink(detailedPost.slug, detailedPost.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200/85 dark:border-slate-850 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 transition-colors cursor-pointer ${
                            copiedLink ? "text-emerald-500 border-emerald-500" : "text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {copiedLink ? <Check className="w-3.5 h-3.5 animate-pulse" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedLink ? "Copied" : "Copy Link"}
                        </button>

                        <button
                          onClick={() => handleTrackShare("twitter", detailedPost.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-sky-500 hover:text-white border border-sky-500/20 hover:bg-sky-550 rounded-lg transition-colors cursor-pointer"
                        >
                          Twitter
                        </button>

                        <button
                          onClick={() => handleTrackShare("linkedin", detailedPost.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-500 hover:text-white border border-blue-500/20 hover:bg-blue-600 rounded-lg transition-colors cursor-pointer"
                        >
                          LinkedIn
                        </button>

                        <button
                          onClick={() => handleTrackShare("facebook", detailedPost.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-indigo-500 hover:text-white border border-indigo-500/20 hover:bg-indigo-600 rounded-lg transition-colors cursor-pointer"
                        >
                          Facebook
                        </button>
                      </div>
                    </div>

                    {shareFeedback && (
                      <div className="text-xs text-emerald-500 bg-emerald-500/5 p-2 rounded-lg font-mono">
                        {shareFeedback}
                      </div>
                    )}
                  </div>
                </article>
              )}
            </motion.div>
          ) : (
            // PUBLIC BLOG ROLL FEED
            <motion.div
              key="feed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              {/* Category tags sliding navigation */}
              <div className="space-y-4">
                <div className="flex md:hidden relative mb-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search topics..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-900 text-xs text-slate-800 dark:text-gray-200 rounded-lg"
                  />
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Curated Categories & Tags
                  </span>
                  {selectedTag && (
                    <button
                      onClick={() => setSelectedTag(null)}
                      className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold"
                    >
                      Clear Filter &times;
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                      selectedTag === null
                        ? "bg-teal-500 text-white border-teal-500 shadow-sm shadow-teal-500/10"
                        : "bg-slate-50 text-slate-500 border-slate-200/50 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-850 dark:hover:bg-slate-850"
                    }`}
                  >
                    All Topics
                  </button>
                  
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                        selectedTag?.toLowerCase() === tag.toLowerCase()
                          ? "bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-500/10"
                          : "bg-slate-50 text-slate-500 border-slate-200/50 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-850 dark:hover:bg-slate-850"
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Blog posts timeline feed */}
              <div className="space-y-8">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-white animate-spin"></div>
                    <p className="text-xs text-slate-400 mt-3 font-mono">Formulating grid values...</p>
                  </div>
                ) : filteredPosts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredPosts.map((post) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35 }}
                        className="group flex flex-col justify-between bg-white dark:bg-slate-900/65 p-6 rounded-2xl border border-slate-120 dark:border-slate-850/80 shadow-xs hover:shadow-md dark:shadow-none hover:border-slate-200 dark:hover:border-slate-800 transition-all cursor-pointer"
                        onClick={() => onSelectPostBySlug(post.slug)}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-mono tracking-wider">
                              {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono font-medium">
                              {post.tags?.[0] ? `#${post.tags[0]}` : ""}
                            </span>
                          </div>

                          <h3 className="text-lg font-serif font-black text-slate-900 dark:text-slate-100 leading-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                            {post.title}
                          </h3>

                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                            {post.summary}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-850/60 text-[10px] text-slate-400 font-mono">
                          <span>{post.authorName || "Editorial"}</span>
                          <span className="flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
                            Read Post &rarr;
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24 border border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
                    <p className="text-sm text-slate-500 font-medium">No cohesive articles match this criteria.</p>
                    <button
                      onClick={() => { setSearchTerm(""); setSelectedTag(null); }}
                      className="mt-2 text-xs font-semibold text-teal-600 dark:text-teal-400"
                    >
                      Reset filters
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email Newsletter Prominent Signup Form Section */}
        <section className="mt-16 pt-5">
          <div className="p-6 md:p-8 rounded-2xl bg-slate-950 text-slate-100 dark:bg-slate-900 dark:border dark:border-slate-800/85 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="absolute right-0 top-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl"></div>
            
            <div className="space-y-2 md:flex-1 md:max-w-md">
              <span className="inline-block px-2 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/25 text-teal-300 text-[10px] uppercase font-bold tracking-widest leading-none">
                Weekly Insights
              </span>
              <h3 className="text-lg md:text-xl font-serif italic text-slate-100">
                Subscribe to Alexander's Weekly Digest
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Receive curated articles on clean digital design systems, full-stack programming, and AI orchestrations. Zero spam. Complete privacy protection.
              </p>
            </div>

            <div className="md:w-72">
              <form onSubmit={handleNewsletterSubmit} className="space-y-2.5">
                <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 focus-within:border-teal-500/60 rounded-lg">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter email to subscribe"
                    className="flex-1 px-2.5 py-1.5 bg-transparent text-slate-200 text-xs focus:ring-0 focus:outline-hidden placeholder-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={newsLoading}
                    className="p-1.5 bg-teal-500 text-white hover:bg-teal-600 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
                  >
                    {newsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {newsMessage && (
                  <p className="text-[10px] text-teal-400 font-semibold">{newsMessage}</p>
                )}
                {newsError && (
                  <p className="text-[10px] text-rose-450 font-semibold">{newsError}</p>
                )}
              </form>
            </div>
          </div>

          {/* Real-time sync logs if active */}
          {(newsStatus || newsLogs.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850 text-xs space-y-2 font-mono"
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-semibold text-slate-500 flex items-center gap-1">
                  <RefreshCcw className="w-3 h-3 animate-spin" /> Integration Pipeline Status
                </span>
                <span className="font-bold text-teal-500">{newsStatus || "Enqueued"}</span>
              </div>
              {newsLogs.map((log, idx) => (
                <div key={idx} className="text-[10px] text-slate-600 dark:text-slate-400 pl-3 border-l border-emerald-500/50">
                  {log}
                </div>
              ))}
            </motion.div>
          )}
        </section>
      </main>

      {/* Footer credit lines */}
      <footer className="mt-16 py-8 border-t border-slate-100 dark:border-slate-900 transition-colors">
        <div className="max-w-6xl mx-auto px-4 text-center text-[10px] tracking-widest text-slate-400 uppercase font-semibold">
          &copy; {new Date().getFullYear()} Mercer Editorial Hub. All rights protected under creative common protocols.
        </div>
      </footer>
    </div>
  );
}
