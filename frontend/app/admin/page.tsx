"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Activity, Clock, CheckCircle, XCircle, Users, BarChart2, RefreshCw, Terminal, Server, HardDrive } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";

function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => apiFetch("/admin/stats"),
  });
}

function usePendingTools() {
  return useQuery({
    queryKey: ["admin-pending-tools"],
    queryFn: () => apiFetch("/admin/tools/pending"),
  });
}

function useSystemHealth() {
  return useQuery({
    queryKey: ["admin-system-health"],
    queryFn: () => apiFetch("/admin/system/health"),
    refetchInterval: 30000
  });
}

function useSystemLogs() {
  return useQuery({
    queryKey: ["admin-system-logs"],
    queryFn: () => apiFetch("/admin/system/logs"),
    refetchInterval: 5000
  });
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const { data: stats } = useAdminStats();
  const { data: pendingTools } = usePendingTools();
  const { data: health } = useSystemHealth();
  const { data: logs } = useSystemLogs();
  const queryClient = useQueryClient();

  const approveTool = useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/tools/${id}/approve`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-tools"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });

  const rejectTool = useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/tools/${id}/reject`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-tools"] });
    },
  });

  const TABS = [
    { id: "overview", label: "Overview", icon: BarChart2 },
    { id: "tools", label: `Pending Tools${stats?.stats?.pendingTools ? ` (${stats.stats.pendingTools})` : ""}`, icon: CheckCircle },
    { id: "jobs", label: "Scraping Jobs", icon: Activity },
    { id: "health", label: "System Health", icon: Server },
    { id: "logs", label: "Server Logs", icon: Terminal },
    { id: "users", label: "Users", icon: Users },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center">
          <Shield className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <p className="text-xs text-muted-foreground">System management and content moderation</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/[0.05] pb-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px",
              activeTab === tab.id
                ? "border-brand-500 text-brand-300"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Data Scraped", value: stats?.totalScraped || 0, color: "text-blue-400" },
              { label: "Total Users", value: stats?.stats?.totalUsers || 0, color: "text-brand-400" },
              { label: "AI Tools", value: stats?.stats?.totalTools || 0, color: "text-green-400" },
              { label: "Pending Approval", value: stats?.stats?.pendingTools || 0, color: "text-yellow-400" },
              { label: "Research Papers", value: stats?.stats?.totalPapers || 0, color: "text-cyan-400" },
            ].map(s => (
              <div key={s.label} className="glass-card p-5 text-center">
                <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Recent Jobs */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-400" />
              Recent Scraping Jobs
            </h3>
            <div className="space-y-2">
              {stats?.recentJobs?.slice(0, 8).map((job: any) => (
                <div key={job.id} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", job.status === "COMPLETED" ? "bg-green-400" : job.status === "FAILED" ? "bg-red-400" : "bg-yellow-400 animate-pulse")} />
                    <span className="text-sm font-mono">{job.jobName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {job.itemsSaved !== undefined && <span>{job.itemsSaved} saved</span>}
                    <span>{formatRelativeTime(job.startedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pending Tools */}
      {activeTab === "tools" && (
        <div className="space-y-3">
          {!pendingTools?.length && (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <p className="text-sm">No pending tools to review</p>
            </div>
          )}
          {pendingTools?.map((tool: any) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 flex items-start gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm">{tool.name}</p>
                  <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-yellow-400/10 border border-yellow-400/20 text-yellow-400">Pending</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{tool.tagline}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{tool.category}</span>
                  <span>•</span>
                  <span>{tool.pricing}</span>
                  <span>•</span>
                  <a href={tool.website} target="_blank" className="text-brand-400 hover:underline">{tool.website}</a>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => approveTool.mutate(tool.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600/20 border border-green-500/30 text-green-400 text-xs font-medium hover:bg-green-600/30 transition-all"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Approve
                </button>
                <button
                  onClick={() => rejectTool.mutate(tool.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-600/30 transition-all"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Scraping Jobs */}
      {activeTab === "jobs" && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Scraping Job History</h3>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-stats"] })}
              className="p-1.5 rounded-lg hover:bg-white/[0.04] text-muted-foreground hover:text-foreground transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.05] text-xs text-muted-foreground text-left">
                  <th className="pb-3 pr-4">Job</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Items Found</th>
                  <th className="pb-3 pr-4">Items Saved</th>
                  <th className="pb-3">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {stats?.recentJobs?.map((job: any) => (
                  <tr key={job.id} className="hover:bg-white/[0.01]">
                    <td className="py-3 pr-4 font-mono text-xs">{job.jobName}</td>
                    <td className="py-3 pr-4">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded font-medium",
                        job.status === "COMPLETED" ? "bg-green-400/10 text-green-400" :
                        job.status === "FAILED" ? "bg-red-400/10 text-red-400" :
                        "bg-yellow-400/10 text-yellow-400"
                      )}>{job.status}</span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{job.itemsFound || "—"}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{job.itemsSaved || "—"}</td>
                    <td className="py-3 text-muted-foreground text-xs">{formatRelativeTime(job.startedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* System Health */}
      {activeTab === "health" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Infrastructure Status</h3>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-system-health"] })}
              className="p-1.5 rounded-lg hover:bg-white/[0.04] text-muted-foreground hover:text-foreground transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "PostgreSQL Database", value: health?.database, icon: HardDrive },
              { label: "Redis Cache Queue", value: health?.redis, icon: Server },
              { label: "Node.js API Server", value: health?.nodeBackend, icon: Activity },
              { label: "Python Scraper Engine", value: health?.pythonWorkers, icon: Terminal },
            ].map(s => (
              <div key={s.label} className="glass-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded bg-white/[0.05] border border-white/[0.05] flex items-center justify-center">
                    <s.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <h4 className="text-sm font-medium">{s.label}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    s.value === "healthy" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" :
                    s.value === "unreachable" ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]" :
                    "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                  )} />
                  <span className="text-sm uppercase tracking-wider font-semibold text-muted-foreground">
                    {s.value || "Loading..."}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Logs */}
      {activeTab === "logs" && (
        <div className="glass-card p-0 overflow-hidden flex flex-col h-[600px]">
          <div className="flex items-center justify-between p-4 border-b border-white/[0.05]">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Terminal className="w-4 h-4 text-brand-400" />
              Live Server Logs
            </h3>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-system-logs"] })}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> View Latest
            </button>
          </div>
          <div className="p-4 bg-background font-mono text-xs overflow-y-auto flex-1 text-muted-foreground space-y-1">
            {!logs?.logs?.length && "Waiting for logs..."}
            {logs?.logs?.map((line: string, i: number) => (
              <div key={i} className="whitespace-pre-wrap break-all border-b border-white/[0.02] pb-1">
                {line.includes('error') || line.includes('Failed') ? (
                  <span className="text-red-400">{line}</span>
                ) : line.includes('warn') ? (
                  <span className="text-yellow-400">{line}</span>
                ) : (
                  line
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
