"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp, BarChart2, Zap } from "lucide-react";
import { api } from "@/lib/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend,
} from "recharts";

const COLORS = ["#4f55ff", "#7c3aed", "#00f5ff", "#ff6b35", "#00ff88", "#a855f7", "#06b6d4", "#f59e0b"];

export default function TrendsPage() {
  const { data: overview } = useQuery({
    queryKey: ["trends-overview"],
    queryFn: api.trends.overview,
  });

  const { data: categories } = useQuery({
    queryKey: ["trends-categories"],
    queryFn: api.trends.categories,
  });

  const categoryData = categories?.slice(0, 8).map((c: any) => ({
    name: c.category.replace(/([A-Z])/g, " $1").trim().split(" ").slice(0, 2).join(" "),
    count: c.count,
    avgTrending: c.avgTrending,
  })) || [];

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-neon-orange" />
          AI Trend Intelligence
        </h1>
        <p className="text-sm text-muted-foreground">Real-time analytics across the AI ecosystem</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "AI Tools", value: overview?.stats?.totalTools || 0, color: "text-brand-400" },
          { label: "AI Models", value: overview?.stats?.totalModels || 0, color: "text-purple-400" },
          { label: "Research Papers", value: overview?.stats?.totalPapers || 0, color: "text-cyan-400" },
          { label: "Repositories", value: overview?.stats?.totalRepos || 0, color: "text-green-400" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 text-center"
          >
            <p className={`text-3xl font-bold font-mono ${stat.color}`}>
              {stat.value.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 className="w-4 h-4 text-brand-400" />
            <h2 className="font-semibold text-sm">Tool Categories</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} margin={{ left: -20, bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "rgba(10,12,20,0.95)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, fontSize: 12 }} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {categoryData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Average Trending Score */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-neon-orange" />
            <h2 className="font-semibold text-sm">Category Trending Scores</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={categoryData.slice(0, 6)}>
              <PolarGrid stroke="rgba(255,255,255,0.05)" />
              <PolarAngleAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 9 }} />
              <Radar name="Avg Trending" dataKey="avgTrending" stroke="#4f55ff" fill="#4f55ff" fillOpacity={0.15} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#64748b" }} />
              <Tooltip contentStyle={{ background: "rgba(10,12,20,0.95)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trending Tools Leaderboard */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Zap className="w-4 h-4 text-neon-orange" />
          <h2 className="font-semibold text-sm">Trending Tools This Week</h2>
        </div>
        <div className="space-y-3">
          {overview?.trendingTools?.map((tool: any, index: number) => (
            <div key={tool.id} className="flex items-center gap-4">
              <span className="text-xs font-mono text-muted-foreground w-5 text-right">{index + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{tool.name}</span>
                  <span className="text-xs font-mono text-neon-orange">{tool.trendingScore?.toFixed(0)}</span>
                </div>
                <div className="score-bar">
                  <div className="score-bar-fill" style={{ width: `${tool.trendingScore}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
