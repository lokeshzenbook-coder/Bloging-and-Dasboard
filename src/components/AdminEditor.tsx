import React, { useState } from "react";
import { Save, Eye, Edit3, Trash2, Sparkles, Wand2, Check, ArrowLeft, Loader2, Send } from "lucide-react";
import { motion } from "motion/react";
import Markdown from "react-markdown";
import { Post } from "../types";

interface AdminEditorProps {
  post: Partial<Post> | null;
  onSave: (postData: Partial<Post>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onBack: () => void;
  authToken: string;
}

type AIAction = "brainstorm" | "proofread" | "generateTags" | "summarize" | "expand";

export default function AdminEditor({ post, onSave, onDelete, onBack, authToken }: AdminEditorProps) {
  const isEditMode = !!post?.id;
  const [title, setTitle] = useState(post?.title || "");
  const [summary, setSummary] = useState(post?.summary || "");
  const [content, setContent] = useState(post?.content || "");
  const [tagsInput, setTagsInput] = useState(post?.tags?.join(", ") || "");
  const [status, setStatus] = useState<"draft" | "published">(post?.status || "draft");

  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<"edit" | "preview" | "split">("split");

  // Gemini AI state
  const [aiAction, setAiAction] = useState<AIAction>("proofread");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [aiError, setAiError] = useState("");

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Please give your masterpiece a title before saving.");
      return;
    }
    setSaving(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await onSave({
        ...post,
        title,
        summary,
        content,
        tags,
        status,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerAI = async () => {
    setAiError("");
    setAiResponse("");
    setAiLoading(true);

    try {
      const res = await fetch("/api/gemini/assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: aiAction,
          prompt: aiPrompt,
          content: content || title || "Empty post",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "AI Assistant failed to generate a response");
      }

      setAiResponse(data.result);
    } catch (err: any) {
      setAiError(err.message || "Failed to fetch AI feedback");
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAI = () => {
    if (!aiResponse) return;

    switch (aiAction) {
      case "proofread":
        setContent(aiResponse);
        break;
      case "generateTags":
        try {
          const parsed = JSON.parse(aiResponse.replace(/```json|```/g, "").trim());
          if (Array.isArray(parsed)) {
            setTagsInput(parsed.join(", "));
          } else {
            setTagsInput(aiResponse.replace(/[\[\]"]/g, ""));
          }
        } catch {
          setTagsInput(aiResponse.replace(/[\[\]"]/g, ""));
        }
        break;
      case "summarize":
        setSummary(aiResponse.trim());
        break;
      case "expand":
        setContent(content + "\n\n" + aiResponse);
        break;
      case "brainstorm":
        // Output into content for manual copying
        setContent(content + "\n\n" + aiResponse);
        break;
      default:
        setContent(content + "\n\n" + aiResponse);
    }
  };

  return (
    <div className="space-y-6">
      {/* Editor Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {isEditMode ? `Edit Post: ${post.title}` : "Draft Creative Article"}
            </h2>
            <p className="text-xs text-slate-500">Draft raw markdown and toggle split-screens dynamically.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Preview switches */}
          <div className="bg-slate-100 dark:bg-slate-850 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 flex gap-0.5 text-xs text-slate-600 dark:text-slate-400">
            <button
              onClick={() => setPreviewMode("edit")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                previewMode === "edit"
                  ? "bg-white dark:bg-slate-800 shadow-sm text-teal-600 dark:text-teal-400"
                  : "hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 inline mr-1" /> Edit
            </button>
            <button
              onClick={() => setPreviewMode("split")}
              className={`hidden md:block px-3 py-1.5 rounded-md font-medium transition-all ${
                previewMode === "split"
                  ? "bg-white dark:bg-slate-800 shadow-sm text-teal-600 dark:text-teal-400"
                  : "hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setPreviewMode("preview")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                previewMode === "preview"
                  ? "bg-white dark:bg-slate-800 shadow-sm text-teal-600 dark:text-teal-400"
                  : "hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Eye className="w-3.5 h-3.5 inline mr-1" /> Preview
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white hover:bg-teal-700 text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Draft
          </button>

          {isEditMode && (
            <button
              onClick={() => {
                if (confirm("Are you sure you want to permanently delete this draft post?")) {
                  onDelete(post.id!);
                }
              }}
              className="p-2 border border-red-200 hover:border-red-600 dark:border-red-950/40 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all"
              title="Delete Article"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Editor & AI split pane */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Write Area */}
        <div className={`xl:col-span-3 space-y-4 ${previewMode === "preview" ? "hidden xl:block" : ""}`}>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs space-y-4 transition-colors">
            {/* Meta details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Article Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 10 Essential Design Patterns"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Publishing Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="draft">Draft (Visible in Workspace only)</option>
                  <option value="published">Published (Visible to all Readers)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Card Meta Summary Description
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Snappy promotional abstract shown on index feeds... (or click AI Summary to populate automatically)"
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Topic Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Design, CSS, Coding"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Separate categories with commas.</span>
              </div>
            </div>
          </div>

          {/* Core Content Markdown Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 h-[500px]">
            {/* Split Input pane */}
            <div className={`col-span-1 h-full ${previewMode === "preview" ? "hidden" : previewMode === "edit" ? "md:col-span-2" : ""}`}>
              <div className="flex flex-col h-full bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs transition-colors">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Markdown Workspace (supports full markdown tags)
                </span>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="# Hello World! Write your masterpiece blog post here with detailed headers, bullet lists, blockquotes, and highlights..."
                  className="flex-1 w-full p-3 font-mono text-sm border-0 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 resize-none outline-hidden overflow-y-auto"
                />
              </div>
            </div>

            {/* Split Render preview pane */}
            <div className={`col-span-1 h-full ${previewMode === "edit" ? "hidden" : previewMode === "preview" ? "md:col-span-2" : ""}`}>
              <div className="flex flex-col h-full bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs transition-colors overflow-hidden">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Live Editorial Blueprint Preview
                </span>
                <div className="flex-1 bg-slate-50/30 dark:bg-slate-950/40 rounded-xl p-4 overflow-y-auto border border-slate-100 dark:border-slate-800/50">
                  <div className="markdown-body text-slate-800 dark:text-slate-300">
                    {content ? (
                      <Markdown>{content}</Markdown>
                    ) : (
                      <p className="text-sm text-slate-400 italic">Pre-rendering content canvas...</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gemini AI Utility Rail Panel */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs transition-colors space-y-4">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Sparkles className="w-4 h-4 text-teal-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">AI Creative Assistant</h3>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Select AI Assistant Action
              </label>
              <select
                value={aiAction}
                onChange={(e) => setAiAction(e.target.value as AIAction)}
                className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-medium focus:outline-hidden"
              >
                <option value="proofread">Proofread Workspace</option>
                <option value="generateTags">Generate Core Tags</option>
                <option value="summarize">Create Snappy TL;DR Summary</option>
                <option value="expand">Expand current section</option>
                <option value="brainstorm">Brainstorm Title/Outlines</option>
              </select>
            </div>

            {/* Custom inputs */}
            {(aiAction === "expand" || aiAction === "brainstorm") && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Custom Prompt Instruction
                </label>
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={
                    aiAction === "expand" 
                      ? "e.g. Elaborate with CSS examples" 
                      : "e.g. Post about SEO marketing secrets"
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg text-xs"
                />
              </div>
            )}

            <button
              onClick={handleTriggerAI}
              disabled={aiLoading}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-4 border border-transparent rounded-lg shadow-xs text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              {aiLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              {aiLoading ? "Consulting Gemini..." : "Generate AI Suggestion"}
            </button>

            {/* Output feedback card */}
            {aiResponse && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Gemini Creative Output
                </span>
                <div className="p-3 bg-slate-55 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 rounded-lg border border-slate-100 dark:border-slate-800 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">
                  {aiResponse}
                </div>
                <button
                  onClick={handleApplyAI}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/40 text-teal-600 dark:text-teal-400 border border-teal-200/40 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply to Current Post</span>
                </button>
              </div>
            )}

            {aiError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/40 rounded-lg text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                <p>{aiError}</p>
                <p className="mt-1 text-[9px] opacity-75">Verify GEMINI_API_KEY stands active inside Secrets cabinet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
