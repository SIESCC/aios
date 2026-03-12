"use client";

import { motion } from "framer-motion";
import {
  Globe, Zap, Brain, BookOpen, Github, Building2,
  Newspaper, GitBranch, BarChart2, Users
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface IndustryMetricsProps {
  data: {
    overview: {
      totalTools: number;
      totalModels: number;
      totalPapers: number;
      totalRepos: number;
      totalStartups: number;
      totalNews: number;
      totalWorkflows: number;
    };
    toolsByCategory: Array<{ category: string; count: number }>;
    modelsByType: Array<{ type: string; count: number }>;
    startupsByCountry: Array<{ country: string; count: number }>;
    topInvestors: Array<{ name: string; count: number }>;
  } | null;
}

const OVERVIEW_CARDS = [
  { key: "totalTools", label: "AI Tools", icon: Zap, color: "text-brand-400", bgGrad: "from-brand-600/20 to-brand-800/5" },
  { key: "totalModels", label: "AI Models", icon: Brain, color: "text-purple-400", bgGrad: "from-purple-600/20 to-purple-800/5" },
  { key: "totalPapers", label: "Papers", icon: BookOpen, color: "text-cyan-400", bgGrad: "from-cyan-600/20 to-cyan-800/5" },
  { key: "totalRepos", label: "Repos", icon: Github, color: "text-green-400", bgGrad: "from-green-600/20 to-green-800/5" },
  { key: "totalStartups", label: "Startups", icon: Building2, color: "text-orange-400", bgGrad: "from-orange-600/20 to-orange-800/5" },
  { key: "totalNews", label: "News", icon: Newspaper, color: "text-yellow-400", bgGrad: "from-yellow-600/20 to-yellow-800/5" },
  { key: "totalWorkflows", label: "Workflows", icon: GitBranch, color: "text-pink-400", bgGrad: "from-pink-600/20 to-pink-800/5" },
];

export function IndustryMetrics({ data }: IndustryMetricsProps) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Global Metrics */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-brand-400" />
          <h2 className="font-semibold text-sm">Global AI Ecosystem Metrics</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {OVERVIEW_CARDS.map((card, i) => {
            const value = data.overview?.[card.key as keyof typeof data.overview] || 0;
            return (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4 text-center group relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGrad} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative">
                  <card.icon className={`w-5 h-5 mx-auto mb-2 ${card.color}`} />
                  <p className="text-xl font-bold font-mono">{formatNumber(Number(value))}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{card.label}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Breakdown grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Categories */}
        <div className="glass-card p-5">
          <h3 className="text-xs font-semibold mb-3 flex items-center gap-2">
            <BarChart2 className="w-3.5 h-3.5 text-brand-400" /> Top Categories
          </h3>
          <div className="space-y-2">
            {data.toolsByCategory?.slice(0, 6).map((cat, i) => (
              <div key={cat.category} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground truncate">{cat.category}</span>
                <span className="text-xs font-mono">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Startups by Country */}
        <div className="glass-card p-5">
          <h3 className="text-xs font-semibold mb-3 flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-orange-400" /> Startups by Country
          </h3>
          <div className="space-y-2">
            {data.startupsByCountry?.slice(0, 6).map((item, i) => (
              <div key={item.country} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{item.country}</span>
                <span className="text-xs font-mono">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Investors */}
        <div className="glass-card p-5">
          <h3 className="text-xs font-semibold mb-3 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-green-400" /> Top Investors
          </h3>
          <div className="space-y-2">
            {data.topInvestors?.slice(0, 6).map((inv, i) => (
              <div key={inv.name} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground truncate">{inv.name}</span>
                <span className="text-xs font-mono">{inv.count} deals</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
