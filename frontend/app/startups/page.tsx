"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2, DollarSign, Globe, Users } from "lucide-react";
import { api } from "@/lib/api";
import { cn, formatFunding, formatDate } from "@/lib/utils";

const ROUNDS = ["All", "Pre-Seed", "Seed", "Series A", "Series B", "Series C", "Series D+", "IPO"];
const ROUND_MAP: Record<string, string> = {
  "Pre-Seed": "PRE_SEED", "Seed": "SEED", "Series A": "SERIES_A",
  "Series B": "SERIES_B", "Series C": "SERIES_C", "Series D+": "SERIES_D_PLUS", "IPO": "IPO",
};
const ROUND_COLORS: Record<string, string> = {
  SEED: "text-green-400 bg-green-400/10 border-green-400/20",
  PRE_SEED: "text-teal-400 bg-teal-400/10 border-teal-400/20",
  SERIES_A: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  SERIES_B: "text-brand-400 bg-brand-400/10 border-brand-400/20",
  SERIES_C: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  SERIES_D_PLUS: "text-pink-400 bg-pink-400/10 border-pink-400/20",
  IPO: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
};

export default function StartupsPage() {
  const [round, setRound] = useState("");
  const [sort, setSort] = useState("newest");

  const { data, isLoading } = useQuery({
    queryKey: ["startups", { round, sort }],
    queryFn: () => api.startups.list({
      ...(round && round !== "All" && { round: ROUND_MAP[round] || round }),
      sort, limit: "30",
    }),
  });

  const startups = data?.startups || [];

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      <div>
        <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
          <Building2 className="w-6 h-6 text-neon-green" />
          AI Startup Intelligence
        </h1>
        <p className="text-sm text-muted-foreground">Track AI startup funding, growth, and trends</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {ROUNDS.map(r => (
            <button
              key={r}
              onClick={() => setRound(r === "All" ? "" : r)}
              className={cn("category-pill", (r === "All" && !round) || r === round ? "active" : "")}
            >
              {r}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm focus:outline-none focus:border-brand-500/40"
        >
          <option value="newest">Latest Funding</option>
          <option value="funding">Largest Round</option>
          <option value="trending">Trending</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading
          ? Array(8).fill(0).map((_, i) => <div key={i} className="h-44 rounded-xl shimmer" />)
          : startups.map((startup: any, index: number) => (
              <motion.div
                key={startup.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center font-bold text-sm">
                      {startup.name[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{startup.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Globe className="w-3 h-3" />
                        <span>{startup.country}</span>
                        {startup.industry && <span>• {startup.industry}</span>}
                      </div>
                    </div>
                  </div>
                  <span className={cn("text-xs px-2 py-1 rounded border font-medium flex-shrink-0", ROUND_COLORS[startup.fundingRound] || "text-muted-foreground bg-muted border-transparent")}>
                    {startup.fundingRound?.replace("_", " ")}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground mb-3 leading-relaxed line-clamp-2">{startup.description}</p>

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                  {startup.fundingAmount ? (
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-neon-green" />
                      <span className="font-bold text-neon-green font-mono text-base">
                        {formatFunding(Number(startup.fundingAmount))}
                      </span>
                    </div>
                  ) : <div />}

                  {startup.investors?.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span className="truncate max-w-[160px]">{startup.investors.slice(0, 2).join(", ")}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
      </div>
    </div>
  );
}
