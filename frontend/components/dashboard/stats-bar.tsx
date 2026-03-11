"use client";

import { motion } from "framer-motion";
import { Zap, Brain, BookOpen, Github } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface StatsBarProps {
  stats?: {
    totalTools: number;
    totalModels: number;
    totalPapers: number;
    totalRepos: number;
  };
}

const statItems = [
  { key: "totalTools", label: "AI Tools", icon: Zap, color: "text-brand-400", glow: "glow-blue", gradient: "from-brand-600/20 to-brand-800/5" },
  { key: "totalModels", label: "AI Models", icon: Brain, color: "text-purple-400", glow: "glow-purple", gradient: "from-purple-600/20 to-purple-800/5" },
  { key: "totalPapers", label: "Papers", icon: BookOpen, color: "text-cyan-400", glow: "glow-cyan", gradient: "from-cyan-600/20 to-cyan-800/5" },
  { key: "totalRepos", label: "Repositories", icon: Github, color: "text-green-400", glow: "", gradient: "from-green-600/20 to-green-800/5" },
];

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, index) => {
        const value = stats?.[item.key as keyof typeof stats] || 0;
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="stat-card group"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity rounded-xl`} />
            <div className="relative flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">
                  {stats ? formatNumber(value) : (
                    <span className="shimmer inline-block w-16 h-7 rounded" />
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
