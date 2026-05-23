import React from "react";
import { Eye, Share2, Users, LineChart as ChartIcon, Laptop, Smartphone, Tablet, Star, ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell, Legend } from "recharts";
import { AnalyticsDashboard } from "../types";

interface AdminDashboardProps {
  stats: AnalyticsDashboard | null;
  loading: boolean;
  onPostSelectSlug: (slug: string) => void;
}

const COLORS = ["#0ea5e9", "#10b981", "#8b5cf6", "#f59e0b"];

export default function AdminDashboard({ stats, loading, onPostSelectSlug }: AdminDashboardProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500">Retrieving aggregated analytics metrics...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center border border-dashed rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <ChartIcon className="w-10 h-10 mx-auto text-slate-400" />
        <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-200">No analytics data recorded</h3>
        <p className="mt-1 text-sm text-slate-500">Wait for readers to visit and interact with your published work.</p>
      </div>
    );
  }

  const { totals, dailyTimeline, platformData, deviceData, topPosts } = stats;

  return (
    <div className="space-y-8">
      {/* Bento Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs flex items-center justify-between transition-colors"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Views</span>
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight">
              {totals.views}
            </span>
            <span className="text-xs text-emerald-500 font-medium flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +12.4% this week
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-sky-50 dark:bg-sky-950/30 text-sky-500 flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs flex items-center justify-between transition-colors"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Social Shares</span>
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight">
              {totals.shares}
            </span>
            <span className="text-xs text-emerald-500 font-medium flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +18.2% this week
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-violet-50 dark:bg-violet-950/30 text-violet-500 flex items-center justify-center">
            <Share2 className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs flex items-center justify-between transition-colors"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Newsletter Subscribers</span>
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight">
              {totals.subscribers}
            </span>
            <span className="text-xs text-slate-400 font-medium block">
              Active marketing targets
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-teal-50 dark:bg-teal-950/30 text-teal-500 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs flex items-center justify-between transition-colors"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Conversion Rate</span>
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight">
              {totals.conversionRate}%
            </span>
            <span className="text-xs text-indigo-500 font-medium flex items-center gap-0.5">
              Conversion from visitors
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 flex items-center justify-center">
            <Star className="w-6 h-6" />
          </div>
        </motion.div>
      </div>

      {/* Main timeline chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs transition-colors">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-200 mb-6 flex items-center gap-2">
          <ChartIcon className="w-4 h-4 text-teal-500" />
          <span>Engagement Timeline (Past 7 Days)</span>
        </h3>
        
        <div className="h-72 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyTimeline} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} />
              <YAxis stroke="#94a3b8" tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff"
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Line type="monotone" name="Article Views" dataKey="views" stroke="#0ea5e9" strokeWidth={2.5} activeDot={{ r: 6 }} />
              <Line type="monotone" name="Social Shares" dataKey="shares" stroke="#8b5cf6" strokeWidth={2} />
              <Line type="monotone" name="Newsletter Signups" dataKey="signups" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary split distribution charts & top posts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs transition-colors space-y-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-violet-500" />
            <span>Sharing Destinations</span>
          </h3>

          <div className="h-44 w-full text-xs">
            {platformData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformData} layout="vertical" margin={{ left: -15, right: 10 }}>
                  <XAxis type="number" tickLine={false} stroke="#94a3b8" />
                  <YAxis type="category" dataKey="name" tickLine={false} stroke="#94a3b8" />
                  <Tooltip cursor={{ fill: "transparent" }} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={12}>
                    {platformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No share events tracked yet.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs transition-colors space-y-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
            <Laptop className="w-4 h-4 text-teal-500" />
            <span>User Device Footprint</span>
          </h3>

          <div className="h-44 w-full text-xs">
            {deviceData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deviceData} margin={{ left: -25, right: 10 }}>
                  <XAxis dataKey="name" tickLine={false} stroke="#94a3b8" />
                  <YAxis tickLine={false} stroke="#94a3b8" />
                  <Tooltip cursor={{ fill: "transparent" }} />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16}>
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                Tracking device models...
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs transition-colors space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5 mb-2">
            <Star className="w-4 h-4 text-amber-500" />
            <span>Top Performing Posts</span>
          </h3>

          <div className="space-y-3">
            {topPosts.length > 0 ? (
              topPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50 transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <button
                      onClick={() => onPostSelectSlug(post.slug)}
                      className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate hover:text-teal-500 text-left block w-full outline-hidden"
                    >
                      {post.title}
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono">
                      /{post.slug}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block font-mono">
                        {post.views}
                      </span>
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider">VIEWS</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Prepare beautiful posts to gather audience traction.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
