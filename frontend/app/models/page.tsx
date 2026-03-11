"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Brain, Trophy, Crown, Code2, Image, Mic } from "lucide-react";
import { api } from "@/lib/api";
import { cn, MODEL_TYPE_COLORS, formatNumber, formatDate } from "@/lib/utils";

const MODEL_TYPES = [
  { id: "LLM", label: "Language Models", icon: Brain },
  { id: "CODE", label: "Code Models", icon: Code2 },
  { id: "IMAGE", label: "Image Models", icon: Image },
  { id: "AUDIO", label: "Audio Models", icon: Mic },
];

export default function ModelsPage() {
  const [activeType, setActiveType] = useState("LLM");

  const { data, isLoading } = useQuery({
    queryKey: ["models-leaderboard", activeType],
    queryFn: () => api.models.leaderboard(activeType),
  });

  const models = data || [];

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          AI Model Leaderboard
        </h1>
        <p className="text-sm text-muted-foreground">Rankings & benchmarks for the world's best AI models</p>
      </div>

      {/* Type Selector */}
      <div className="flex flex-wrap gap-3">
        {MODEL_TYPES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveType(id)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl border font-medium text-sm transition-all",
              activeType === id
                ? "border-brand-500/40 bg-brand-600/20 text-brand-300"
                : "border-white/[0.06] text-muted-foreground hover:text-foreground hover:border-white/10"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="glass-card overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/[0.05] text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <div className="col-span-1">#</div>
          <div className="col-span-3">Model</div>
          <div className="col-span-2">Organization</div>
          <div className="col-span-1">Context</div>
          <div className="col-span-2">Benchmarks</div>
          <div className="col-span-2">Capabilities</div>
          <div className="col-span-1">Released</div>
        </div>

        <div className="divide-y divide-white/[0.03]">
          {isLoading ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="px-5 py-4 h-16 shimmer" />
            ))
          ) : models.map((model: any, index: number) => (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors items-center group"
            >
              {/* Rank */}
              <div className="col-span-1 flex items-center">
                {index === 0 && <Crown className="w-4 h-4 text-yellow-400" />}
                {index === 1 && <span className="text-slate-400 font-mono font-bold">2</span>}
                {index === 2 && <span className="text-orange-600 font-mono font-bold">3</span>}
                {index > 2 && <span className="text-muted-foreground font-mono text-sm">{index + 1}</span>}
              </div>

              {/* Model */}
              <div className="col-span-3">
                <p className="font-semibold text-sm group-hover:text-brand-300 transition-colors">{model.name}</p>
                {model.parameterCount && (
                  <p className="text-xs text-muted-foreground font-mono">{model.parameterCount}</p>
                )}
                <div className="flex items-center gap-1.5 mt-1">
                  {model.openSource && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-400/10 border border-green-400/20 text-green-400">Open Source</span>
                  )}
                  {model.apiAvailable && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/20 text-cyan-400">API</span>
                  )}
                </div>
              </div>

              {/* Organization */}
              <div className="col-span-2 text-sm text-muted-foreground">{model.organization}</div>

              {/* Context */}
              <div className="col-span-1 text-xs font-mono text-muted-foreground">
                {model.contextWindow ? formatNumber(model.contextWindow) : "—"}
              </div>

              {/* Benchmarks */}
              <div className="col-span-2">
                {model.benchmarks && Object.entries(model.benchmarks).slice(0, 2).map(([key, val]: any) => (
                  <div key={key} className="flex items-center justify-between text-xs mb-0.5">
                    <span className="text-muted-foreground uppercase text-[10px]">{key}</span>
                    <span className="font-mono text-neon-cyan">{val}</span>
                  </div>
                ))}
              </div>

              {/* Capabilities */}
              <div className="col-span-2 flex flex-wrap gap-1">
                {model.capabilities?.slice(0, 3).map((cap: string) => (
                  <span key={cap} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-muted-foreground capitalize">
                    {cap}
                  </span>
                ))}
              </div>

              {/* Released */}
              <div className="col-span-1 text-xs text-muted-foreground">
                {model.releaseDate ? formatDate(model.releaseDate) : "—"}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
