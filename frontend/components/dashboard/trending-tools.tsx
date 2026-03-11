"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp, ArrowUpRight, Flame } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface Tool {
  id: string; slug: string; name: string; tagline?: string;
  category: string; logoUrl?: string; trendingScore: number; weeklyGrowth: number;
}

export function TrendingTools({ tools }: { tools: Tool[] }) {
  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="section-header-line" />
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-neon-orange" />
            <h2 className="font-semibold text-sm">Trending AI Tools</h2>
          </div>
        </div>
        <Link href="/tools" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
          View all <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tools.length === 0
          ? Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-20 rounded-xl shimmer" />
            ))
          : tools.map((tool, index) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/tools/${tool.slug}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-white/[0.06] hover:bg-white/[0.02] transition-all group cursor-pointer">
                    {/* Rank */}
                    <span className="text-xs font-mono text-muted-foreground w-5 flex-shrink-0 text-right">
                      {index + 1}
                    </span>

                    {/* Logo */}
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-600/30 to-purple-600/20 border border-white/[0.06] flex items-center justify-center flex-shrink-0 text-sm overflow-hidden">
                      {tool.logoUrl ? (
                        <img src={tool.logoUrl} alt={tool.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{tool.name[0]}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:text-brand-300 transition-colors">
                        {tool.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{tool.category}</p>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 text-neon-orange text-xs font-mono">
                        <TrendingUp className="w-3 h-3" />
                        {tool.trendingScore.toFixed(0)}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
      </div>
    </div>
  );
}
