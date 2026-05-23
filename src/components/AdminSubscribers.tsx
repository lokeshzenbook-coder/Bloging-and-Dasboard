import React, { useState, useEffect } from "react";
import { Users, Mail, Sliders, CheckCircle, Save, ArrowRight, Server, Loader2, Sparkles, HelpCircle } from "lucide-react";
import { Subscriber, IntegrationSettings } from "../types";

interface AdminSubscribersProps {
  authToken: string;
}

export default function AdminSubscribers({ authToken }: AdminSubscribersProps) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationSettings | null>(null);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [loadingInts, setLoadingInts] = useState(true);
  const [savingInts, setSavingInts] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchSubscribers = async () => {
    try {
      const res = await fetch("/api/admin/subscribers", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSubs(false);
    }
  };

  const fetchIntegrations = async () => {
    try {
      const res = await fetch("/api/admin/integrations", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInts(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
    fetchIntegrations();
  }, [authToken]);

  const handleSaveIntegrations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!integrations) return;

    setSavingInts(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(integrations),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update campaign setup settings");
      }

      setMessage(data.message || "Email marketing configurations updated.");
      setIntegrations(data.data);
    } catch (err: any) {
      setError(err.message || "Writing sync error");
    } finally {
      setSavingInts(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Newsletter Subscribers List */}
      <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs transition-colors space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Users className="w-4 h-4 text-teal-500" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-200">Active Audience</h3>
        </div>

        {loadingSubs ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
          </div>
        ) : subscribers.length > 0 ? (
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {subscribers.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/30 bg-slate-50/50 dark:bg-slate-950/20"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">
                    {sub.email}
                  </span>
                  <span className="text-[9px] text-slate-400 block font-mono">
                    Subscribed on {new Date(sub.subscribedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/20">
                  Active
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-sm">
            No newsletter subscribers recorded.
          </div>
        )}
      </div>

      {/* Campaign Integrations */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-xs transition-colors space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Sliders className="w-4 h-4 text-indigo-500" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-200">Campaign Marketing Portals</h3>
        </div>

        {loadingInts ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : !integrations ? (
          <div>Connection config error.</div>
        ) : (
          <form onSubmit={handleSaveIntegrations} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mailchimp Form Card */}
              <div className="p-5 border border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-950/25 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                      M
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Mailchimp Portal</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={integrations.mailchimpEnabled}
                    onChange={(e) => setIntegrations({ ...integrations, mailchimpEnabled: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500/20 h-4 w-4"
                  />
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Mailchimp API Key
                    </label>
                    <input
                      type="password"
                      value={integrations.mailchimpApiKey}
                      onChange={(e) => setIntegrations({ ...integrations, mailchimpApiKey: e.target.value })}
                      placeholder="md-xxxxxxxxxxxxxxxx"
                      disabled={!integrations.mailchimpEnabled}
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg disabled:opacity-50 text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Audience List ID
                    </label>
                    <input
                      type="text"
                      value={integrations.mailchimpAudienceId}
                      onChange={(e) => setIntegrations({ ...integrations, mailchimpAudienceId: e.target.value })}
                      placeholder="e.g. 5da3f78cc"
                      disabled={!integrations.mailchimpEnabled}
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg disabled:opacity-50 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* SendGrid Form Card */}
              <div className="p-5 border border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-950/25 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded bg-blue-500 text-white flex items-center justify-center font-bold text-xs">
                      S
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">SendGrid Automation</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={integrations.sendgridEnabled}
                    onChange={(e) => setIntegrations({ ...integrations, sendgridEnabled: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500/20 h-4 w-4"
                  />
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      SendGrid Secret Key
                    </label>
                    <input
                      type="password"
                      value={integrations.sendgridApiKey}
                      onChange={(e) => setIntegrations({ ...integrations, sendgridApiKey: e.target.value })}
                      placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxx"
                      disabled={!integrations.sendgridEnabled}
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg disabled:opacity-50 text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Verified Sender Email Address
                    </label>
                    <input
                      type="email"
                      value={integrations.sendgridSenderEmail}
                      onChange={(e) => setIntegrations({ ...integrations, sendgridSenderEmail: e.target.value })}
                      placeholder="newsletter@domain.com"
                      disabled={!integrations.sendgridEnabled}
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg disabled:opacity-50 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated webhook tester info */}
            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/40 dark:border-indigo-900/30 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                <HelpCircle className="w-4 h-4" /> Real-time Dispatch Syncing Logs
              </span>
              <p>When readers subscribe or posts publish, active triggers dynamically format notifications into JSON and dispatch to endpoints. Enabling either service integrates automated pipeline syncing with logs displayed on the subscription card.</p>
            </div>

            {message && (
              <div className="p-3 bg-teal-50 dark:bg-teal-950/35 border border-teal-200/50 rounded-lg">
                <span className="text-xs text-teal-700 dark:text-teal-400 font-semibold block">{message}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-55 dark:bg-rose-950/35 border border-rose-250/50 rounded-lg">
                <span className="text-xs text-rose-700 dark:text-rose-450 block">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={savingInts}
              className="inline-flex items-center gap-1.5 py-2 px-5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all disabled:opacity-55"
            >
              {savingInts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Integration Portals Setup</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
