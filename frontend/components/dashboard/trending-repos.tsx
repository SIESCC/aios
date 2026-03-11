"use client";

import { Github, ArrowUpRight, Star, TrendingUp } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import Link from "next/link";

interface Repo {
  id: string; fullName: string; description?: string;
  stars: number; weeklyGrowth: number; language?: string; repoUrl: string;
}

const LANG_COLORS: Record<string, string> = {
  Python: "#3776ab", TypeScript: "#3178c6", JavaScript: "#f7df1e",
  Rust: "#dea584", Go: "#00add8", Julia: "#9558b2", C: "#555555",
};

export function TrendingRepos({ repos }: { repos: Repo[] }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="section-header-line" />
          <div className="flex items-center gap-2">
            <Github className="w-4 h-4 text-foreground" />
            <h2 className="font-semibold text-sm">Trending Repositories</h2>
          </div>
        </div>
        <Link href="/repos" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
          View all <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {repos.length === 0
          ? Array(5).fill(0).map((_, i) => <div key={i} className="h-16 rounded-xl shimmer" />)
          : repos.map((repo) => (
              <a key={repo.id} href={repo.repoUrl} target="_blank" rel="noopener noreferrer">
                <div className="leaderboard-row">
                  {/* Repo Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold font-mono truncate text-brand-300 hover:text-brand-200">
                      {repo.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{repo.description}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {repo.language && (
                        <div className="flex items-center gap-1">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: LANG_COLORS[repo.language] || "#888" }}
                          />
                          <span className="text-xs text-muted-foreground">{repo.language}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-yellow-400 text-xs">
                      <Star className="w-3 h-3" />
                      <span className="font-mono">{formatNumber(repo.stars)}</span>
                    </div>
                    {repo.weeklyGrowth > 0 && (
                      <div className="flex items-center gap-0.5 text-neon-green text-xs">
                        <TrendingUp className="w-3 h-3" />
                        <span className="font-mono">+{formatNumber(repo.weeklyGrowth)}/wk</span>
                      </div>
                    )}
                  </div>
                </div>
              </a>
            ))}
      </div>
    </div>
  );
}
