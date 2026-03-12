"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp, BarChart2, Zap, Flame, Star, BookOpen, Building2, Rocket, ArrowUpRight, Github } from "lucide-react";
import { api } from "@/lib/api";
import { formatNumber, formatDate, formatFunding } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend,
  PieChart, Pie,
} from "recharts";
import Link from "next/link";

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

  const { data: analytics } = useQuery({
    queryKey: ["growth-analytics"],
    queryFn: api.trends.growthAnalytics,
  });

  const categoryData = categories?.slice(0, 8).map((c: any) => ({
    name: c.category.replace(/([A-Z])/g, " $1").trim().split(" ").slice(0, 2).join(" "),
    count: c.count,
    avgTrending: c.avgTrending,
  })) || [];

  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      <div>
        <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-neon-orange" />
          AI Trend Intelligence
        </h1>
        <p className="text-sm text-muted-foreground">Real-time analytics and growth signals across the AI ecosystem</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "AI Tools", value: overview?.stats?.totalTools || 0, color: "text-brand-400", icon: Zap },
          { label: "AI Models", value: overview?.stats?.totalModels || 0, color: "text-purple-400", icon: Star },
          { label: "Research Papers", value: overview?.stats?.totalPapers || 0, color: "text-cyan-400", icon: BookOpen },
          { label: "Repositories", value: overview?.stats?.totalRepos || 0, color: "text-green-400", icon: Github },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold font-mono ${stat.color}`}>
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
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

        {/* Radar */}
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

      {/* Top Trending Tools This Week */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Flame className="w-4 h-4 text-neon-orange" />
          <h2 className="font-semibold text-sm">🔥 Top Trending AI Tools This Week</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(analytics?.topTrendingTools || overview?.trendingTools || []).map((tool: any, index: number) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.02] transition-colors group"
            >
              <span className={`text-lg font-bold font-mono w-8 text-center ${index < 3 ? "text-neon-orange" : "text-muted-foreground"}`}>
                {index + 1}
              </span>
              {tool.logoUrl ? (
                <img src={tool.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600/30 to-purple-600/30 flex items-center justify-center text-xs font-bold">
                  {tool.name?.[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <Link href={`/tools/${tool.slug}`} className="font-semibold text-sm group-hover:text-brand-300 transition-colors truncate block">
                  {tool.name}
                </Link>
                <p className="text-xs text-muted-foreground truncate">{tool.tagline || tool.category}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono text-neon-orange">{tool.trendingScore?.toFixed(0)}</p>
                {tool.weeklyGrowth > 0 && (
                  <p className="text-[10px] text-green-400 flex items-center gap-0.5">
                    <ArrowUpRight className="w-3 h-3" />{tool.weeklyGrowth?.toFixed(0)}%
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Two columns: Fastest Repos + Most Active Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fastest Growing Repos */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Rocket className="w-4 h-4 text-green-400" />
            <h2 className="font-semibold text-sm">🚀 Fastest Growing AI Repositories</h2>
          </div>
          <div className="space-y-3">
            {(analytics?.fastestGrowingRepos || []).map((repo: any, i: number) => (
              <motion.a
                key={repo.id}
                href={repo.repoUrl}
                target="_blank"
                rel="noopener"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors group"
              >
                <span className="text-xs font-mono text-muted-foreground w-5 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-brand-300 transition-colors">{repo.fullName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{repo.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-mono">⭐ {formatNumber(repo.stars)}</p>
                  <p className="text-[10px] text-green-400">+{formatNumber(repo.weeklyGrowth)}/wk</p>
                </div>
              </motion.a>
            ))}
          </div>
        </div>

        {/* Most Active Categories */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 className="w-4 h-4 text-purple-400" />
            <h2 className="font-semibold text-sm">📊 Most Active AI Categories</h2>
          </div>
          <div className="space-y-3">
            {(analytics?.mostActiveCategories || []).map((cat: any, i: number) => (
              <motion.div
                key={cat.category}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3"
              >
                <span className="text-xs font-mono text-muted-foreground w-5 text-right">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{cat.category}</span>
                    <span className="text-xs font-mono text-muted-foreground">{cat.count} tools</span>
                  </div>
                  <div className="score-bar">
                    <div className="score-bar-fill" style={{ width: `${Math.min(100, cat.avgTrending)}%` }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Research + Startup Funding */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Research Activity */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h2 className="font-semibold text-sm">📄 Emerging Research</h2>
          </div>
          <div className="space-y-3">
            {(analytics?.recentPapers || []).map((paper: any, i: number) => (
              <motion.div
                key={paper.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-6 h-6 rounded bg-cyan-400/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <BookOpen className="w-3 h-3 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{paper.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {paper.category && <span className="text-[10px] category-pill">{paper.category}</span>}
                    {paper.publicationDate && <span className="text-[10px] text-muted-foreground">{formatDate(paper.publicationDate)}</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Startup Funding */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 className="w-4 h-4 text-green-400" />
            <h2 className="font-semibold text-sm">💰 Startup Funding Events</h2>
          </div>
          <div className="space-y-3">
            {(analytics?.recentStartupFunding || []).map((startup: any, i: number) => (
              <motion.div
                key={startup.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-green-400/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{startup.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{startup.industry}</span>
                    <span className="text-[10px] text-muted-foreground">{startup.country}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-green-400">
                    {startup.fundingAmount ? formatFunding(Number(startup.fundingAmount)) : "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{startup.fundingRound?.replace("_", " ")}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
