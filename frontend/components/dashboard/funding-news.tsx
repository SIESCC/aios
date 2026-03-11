"use client";

import { Building2, ArrowUpRight, DollarSign } from "lucide-react";
import { formatFunding, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

interface Startup {
  id: string; name: string; slug: string;
  fundingAmount?: number; fundingRound: string;
  fundingDate?: string; industry?: string; country?: string;
  investors: string[];
}

const ROUND_COLORS: Record<string, string> = {
  SEED: "text-green-400 bg-green-400/10",
  PRE_SEED: "text-teal-400 bg-teal-400/10",
  SERIES_A: "text-blue-400 bg-blue-400/10",
  SERIES_B: "text-brand-400 bg-brand-400/10",
  SERIES_C: "text-purple-400 bg-purple-400/10",
  SERIES_D_PLUS: "text-pink-400 bg-pink-400/10",
  IPO: "text-yellow-400 bg-yellow-400/10",
  ACQUIRED: "text-orange-400 bg-orange-400/10",
};

const ROUND_LABELS: Record<string, string> = {
  SEED: "Seed", PRE_SEED: "Pre-Seed", SERIES_A: "Series A",
  SERIES_B: "Series B", SERIES_C: "Series C", SERIES_D_PLUS: "Series D+",
  IPO: "IPO", ACQUIRED: "Acquired", GRANT: "Grant", UNKNOWN: "Unknown",
};

export function FundingNews({ startups }: { startups: Startup[] }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="section-header-line" />
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-neon-green" />
            <h2 className="font-semibold text-sm">Latest Funding Rounds</h2>
          </div>
        </div>
        <Link href="/startups" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
          View all <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {startups.length === 0
          ? Array(4).fill(0).map((_, i) => <div key={i} className="h-16 rounded-xl shimmer" />)
          : startups.map((startup) => (
              <Link key={startup.id} href={`/startups/${startup.slug}`}>
                <div className="leaderboard-row">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{startup.name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ROUND_COLORS[startup.fundingRound] || "text-muted-foreground bg-muted"}`}>
                        {ROUND_LABELS[startup.fundingRound] || startup.fundingRound}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {startup.industry} • {startup.country}
                      {startup.fundingDate && ` • ${formatRelativeTime(startup.fundingDate)}`}
                    </p>
                  </div>
                  {startup.fundingAmount && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-neon-green font-mono">
                        {formatFunding(Number(startup.fundingAmount))}
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
}
