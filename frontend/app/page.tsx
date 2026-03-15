"use client";

import { useState, useCallback } from "react";
import {
  TrendingUp,
  Database,
  Upload,
  RefreshCw,
  ChartBar,
  Activity,
  Globe,
  Star,
  X,
} from "lucide-react";
import ChatSidebar from "@/components/ChatSidebar";
import DashboardRenderer from "@/components/DashboardRenderer";
import { postQuery, uploadCSV, DashboardData } from "@/lib/api";

const EXAMPLE_QUERIES = [
  "Show monthly revenue trend",
  "Revenue by product category",
  "Top 5 regions by revenue",
  "Payment method distribution",
  "Show revenue by region for Electronics",
  "Average rating by category",
  "Monthly quantity sold trend",
];

interface Message {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
}

interface HistoryEntry {
  query: string;
  data: DashboardData;
  id: number;
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="stat-card p-4 flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(99,102,241,0.15)" }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {label}
        </p>
        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
          {value}
        </p>
        {sub && (
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeDashboard, setActiveDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [convHistory, setConvHistory] = useState<{ query: string; title?: string }[]>([]);

  const addMessage = (msg: Message) => setMessages((prev) => [...prev, msg]);

  const handleQuery = useCallback(
    async (query: string) => {
      addMessage({ role: "user", content: query });
      addMessage({ role: "assistant", content: "", isLoading: true });
      setIsLoading(true);

      try {
        const res = await postQuery(query, convHistory);

        // Remove loading bubble
        setMessages((prev) => prev.filter((m) => !m.isLoading));

        if (res.success && res.data) {
          const data = res.data;
          setActiveDashboard(data);
          setHistory((prev) => [{ query, data, id: Date.now() }, ...prev].slice(0, 12));
          setConvHistory((prev) => [...prev, { query, title: data.title }]);
          addMessage({
            role: "assistant",
            content: `✅ ${data.title} — ${data.data_points} data points from ${data.total_rows_queried.toLocaleString()} rows.`,
          });
        } else {
          addMessage({
            role: "assistant",
            content: `⚠️ ${res.error || "Could not generate dashboard."}`,
          });
        }
      } catch (e) {
        setMessages((prev) => prev.filter((m) => !m.isLoading));
        addMessage({
          role: "assistant",
          content: "❌ Backend unreachable. Make sure the FastAPI server is running on port 8000.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [convHistory]
  );

  const handleDrillDown = useCallback(
    (label: string) => {
      if (!activeDashboard?.group_by) return;
      const query = `Filter by ${activeDashboard.group_by.replace(/_/g, " ")}: ${label}`;
      handleQuery(query);
    },
    [activeDashboard, handleQuery]
  );

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus("Uploading…");
    try {
      const res = await uploadCSV(file);
      setUploadStatus(`✅ ${res.rows.toLocaleString()} rows loaded`);
    } catch {
      setUploadStatus("❌ Upload failed");
    }
    setTimeout(() => setUploadStatus(null), 4000);
  };

  const totalRevenue =
    activeDashboard?.aggregation === "sum" && activeDashboard.metric === "total_revenue"
      ? activeDashboard.chart_data.reduce((s, d) => s + d.value, 0)
      : null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      {/* ── Left: Chat Sidebar ─────────────────────────────────────────── */}
      <div
        className="w-72 flex-shrink-0 flex flex-col border-r"
        style={{ borderColor: "var(--border-color)" }}
      >
        <ChatSidebar
          onQuery={handleQuery}
          isLoading={isLoading}
          messages={messages}
          exampleQueries={EXAMPLE_QUERIES}
        />
      </div>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
          style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}
        >
          <div>
            <h1 className="text-lg font-bold gradient-text">
              Conversational BI Dashboard
            </h1>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              AI-powered business intelligence · Powered by Gemini
            </p>
          </div>
          <div className="flex items-center gap-3">
            {uploadStatus && (
              <span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }}>
                {uploadStatus}
              </span>
            )}
            <label className="cursor-pointer flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all hover:scale-105"
              style={{ background: "rgba(99,102,241,0.12)", border: "1px solid var(--border-color)", color: "#a5b4fc" }}>
              <Upload size={13} /> Upload CSV
              <input type="file" accept=".csv" className="hidden" onChange={handleUpload} />
            </label>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Welcome state */}
          {!activeDashboard && (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 pulse-glow"
                style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
              >
                <Activity size={38} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2 gradient-text">
                Your AI Data Analyst
              </h2>
              <p className="text-sm max-w-md mb-6" style={{ color: "var(--text-secondary)" }}>
                Ask questions in plain English. The AI interprets your query, runs it against the
                sales dataset, and renders an interactive chart — instantly.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-md w-full">
                {EXAMPLE_QUERIES.slice(0, 4).map((q) => (
                  <button
                    key={q}
                    onClick={() => handleQuery(q)}
                    className="text-left text-xs px-4 py-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: "rgba(99,102,241,0.08)",
                      border: "1px solid rgba(99,102,241,0.2)",
                      color: "#a5b4fc",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Dashboard */}
          {activeDashboard && (
            <div className="animate-slide-up space-y-5">
              {/* Stat row */}
              <div className="grid grid-cols-4 gap-4">
                <StatCard
                  icon={<TrendingUp size={18} style={{ color: "#6366f1" }} />}
                  label="Data Points"
                  value={activeDashboard.data_points.toLocaleString()}
                />
                <StatCard
                  icon={<Database size={18} style={{ color: "#06b6d4" }} />}
                  label="Rows Queried"
                  value={activeDashboard.total_rows_queried.toLocaleString()}
                />
                <StatCard
                  icon={<ChartBar size={18} style={{ color: "#10b981" }} />}
                  label="Chart Type"
                  value={activeDashboard.chart_type.charAt(0).toUpperCase() + activeDashboard.chart_type.slice(1)}
                />
                {totalRevenue !== null ? (
                  <StatCard
                    icon={<Globe size={18} style={{ color: "#f59e0b" }} />}
                    label="Total Revenue"
                    value={
                      totalRevenue >= 1_000_000
                        ? `$${(totalRevenue / 1_000_000).toFixed(2)}M`
                        : `$${totalRevenue.toLocaleString()}`
                    }
                  />
                ) : (
                  <StatCard
                    icon={<Star size={18} style={{ color: "#f59e0b" }} />}
                    label="Aggregation"
                    value={activeDashboard.aggregation.charAt(0).toUpperCase() + activeDashboard.aggregation.slice(1)}
                    sub={`of ${activeDashboard.metric.replace(/_/g, " ")}`}
                  />
                )}
              </div>

              {/* Chart card */}
              <div className="glass-card p-6">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                      {activeDashboard.title}
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {activeDashboard.summary}
                      {Object.keys(activeDashboard.filters_applied).length > 0 && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs"
                          style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }}>
                          {Object.entries(activeDashboard.filters_applied)
                            .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
                            .join(" · ")}
                        </span>
                      )}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full flex-shrink-0"
                    style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc" }}
                  >
                    {activeDashboard.chart_type} chart
                  </span>
                </div>
                <div className="mt-4">
                  <DashboardRenderer data={activeDashboard} onDrillDown={handleDrillDown} />
                </div>
              </div>
            </div>
          )}

          {/* History strip */}
          {history.length > 1 && (
            <div className="space-y-2">
              <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Recent dashboards
              </p>
              <div className="flex flex-wrap gap-2">
                {history.slice(1, 8).map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setActiveDashboard(h.data)}
                    className="text-xs px-3 py-1.5 rounded-full transition-all hover:-translate-y-0.5"
                    style={{
                      background: "rgba(99,102,241,0.08)",
                      border: "1px solid rgba(99,102,241,0.15)",
                      color: "#9ca3af",
                    }}
                  >
                    {h.data.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
