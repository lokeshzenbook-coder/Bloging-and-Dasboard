import React, { useState } from "react";
import { LogIn, Key, Loader2, Sparkles, LayoutDashboard, Compass } from "lucide-react";
import { motion } from "motion/react";
import { User } from "../types";

interface AuthScreenProps {
  onAuthSuccess: (token: string, user: User) => void;
  onBackToReader: () => void;
}

export default function AuthScreen({ onAuthSuccess, onBackToReader }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = isLogin ? { email, password } : { name, email, password };
    const url = isLogin ? "/api/auth/login" : "/api/auth/register";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Please verify credentials.");
      }

      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
        <button
          onClick={onBackToReader}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
        >
          <Compass className="w-4 h-4" />
          <span>Back to Reader Feed</span>
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-xl bg-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <LayoutDashboard className="w-6 h-6" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
          {isLogin ? "Creator Workspace" : "Create Author Profile"}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          Or{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
          >
            {isLogin ? "register a new writer account" : "login to existing workspace"}
          </button>
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-200/60 dark:border-slate-800/80 transition-colors duration-200">
          {isLogin && (
            <div className="mb-6 p-4 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100/50 dark:border-teal-900/30">
              <span className="text-xs font-semibold text-teal-800 dark:text-teal-400 uppercase tracking-wider block mb-1">
                Demo Starter Credentials
              </span>
              <div className="text-sm space-y-1 text-slate-600 dark:text-slate-300">
                <p>Email: <span className="font-mono bg-white dark:bg-slate-800 px-1 py-0.5 rounded text-xs select-all">admin@blog.com</span></p>
                <p>Password: <span className="font-mono bg-white dark:bg-slate-800 px-1 py-0.5 rounded text-xs select-all">password123</span></p>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-800 rounded-lg shadow-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 sm:text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@blog.com"
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-800 rounded-lg shadow-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 sm:text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-800 rounded-lg shadow-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 sm:text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg">
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  {error}
                </p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-xs text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-55 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isLogin ? (
                  <span className="flex items-center gap-1.5"><LogIn className="w-4 h-4" /> Enter Writing Room</span>
                ) : (
                  <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Create Profile</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
