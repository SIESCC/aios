"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Github, Star, TrendingUp, GitFork } from "lucide-react";
import { api } from "@/lib/api";
import { cn, formatNumber, formatRelativeTime } from "@/lib/utils";

const LANGUAGES = ["All", "Python", "TypeScript", "JavaScript", "Rust", "Go", "Julia", "C++"];
const LANG_COLORS: Record<string, string> = {
  Python: "#3776ab", TypeScript: "#3178c6", JavaScript: "#f7df1e",
  Rust: "#dea584", Go: "#00add8", Julia: "#9558b2",
};

export default function ReposPage() {
  const [language, setLanguage] = useState("");
  const [sort, setSort] = useState("stars");

  const { data, isLoading } = useQuery({
    queryKey: ["repos", { language, sort }],
    queryFn: () => api.repos.list({
      ...(language && language !== "All" && { language }),
      sort, limit: "30",
    }),
  });

  const repos = data?.repos || [];

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      <div>
        <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
          <Github className="w-6 h-6 text-white" />
          AI GitHub Intelligence
        </h1>
        <p className="text-sm text-muted-foreground">Trending AI repositories across GitHub</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(lang => (
            <button
              key={lang}
              onClick={() => setLanguage(lang === "All" ? "" : lang)}
              className={cn("flex items-center gap-1.5 category-pill", (lang === "All" && !language) || lang === language ? "active" : "")}
            >
              {lang !== "All" && LANG_COLORS[lang] && (
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LANG_COLORS[lang] }} />
              )}
              {lang}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {[{v: "stars", l: "Most Stars"}, {v: "growth", l: "Fastest Growing"}, {v: "forks", l: "Most Forks"}].map(o => (
            <button
              key={o.v}
              onClick={() => setSort(o.v)}
              className={cn("px-3 py-1.5 rounded-lg border text-xs font-medium transition-all", sort === o.v ? "border-brand-500/40 bg-brand-600/20 text-brand-300" : "border-white/[0.06] text-muted-foreground hover:text-foreground")}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {isLoading
          ? Array(10).fill(0).map((_, i) => <div key={i} className="h-20 rounded-xl shimmer" />)
          : repos.map((repo: any, index: number) => (
              <motion.a
                key={repo.id}
                href={repo.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="glass-card p-4 flex items-center gap-4 block"
              >
                <div className="w-8 text-center text-muted-foreground font-mono text-sm flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-mono font-semibold text-sm text-brand-300 hover:text-brand-200">{repo.fullName}</p>
                    {repo.topics?.slice(0, 2).map((topic: string) => (
                      <span key={topic} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.05] text-muted-foreground">{topic}</span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{repo.description}</p>
                  {repo.language && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LANG_COLORS[repo.language] || "#888" }} />
                      <span className="text-xs text-muted-foreground">{repo.language}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star className="w-3.5 h-3.5 fill-yellow-400" />
                      <span className="text-sm font-bold font-mono">{formatNumber(repo.stars)}</span>
                    </div>
                    {repo.weeklyGrowth > 0 && (
                      <div className="flex items-center gap-0.5 text-neon-green text-xs mt-0.5">
                        <TrendingUp className="w-3 h-3" />
                        <span className="font-mono">+{formatNumber(repo.weeklyGrowth)}/wk</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <GitFork className="w-3 h-3" />
                      <span className="font-mono">{formatNumber(repo.forks)}</span>
                    </div>
                  </div>
                </div>
              </motion.a>
            ))}
      </div>
    </div>
  );
}
