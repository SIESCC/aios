"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BookOpen, Search, Users, Calendar, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { cn, formatRelativeTime } from "@/lib/utils";

const CATEGORIES = ["All", "cs.AI", "cs.LG", "cs.CL", "cs.CV", "cs.RO", "stat.ML"];

export default function ResearchPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["research", { search, category, sort, page }],
    queryFn: () => api.research.list({
      ...(search && { search }),
      ...(category && category !== "All" && { category }),
      sort, page: String(page), limit: "20",
    }),
  });

  const papers = data?.papers || [];

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      <div>
        <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-cyan-400" />
          AI Research Intelligence
        </h1>
        <p className="text-sm text-muted-foreground">Latest papers from arXiv with AI-generated summaries</p>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search papers..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-brand-500/40"
          />
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm focus:outline-none focus:border-brand-500/40"
        >
          <option value="newest">Newest</option>
          <option value="trending">Trending</option>
          <option value="cited">Most Cited</option>
        </select>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat === "All" ? "" : cat)}
            className={cn("category-pill", (cat === "All" && !category) || cat === category ? "active" : "")}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Papers List */}
      <div className="space-y-4">
        {isLoading
          ? Array(6).fill(0).map((_, i) => <div key={i} className="h-40 rounded-xl shimmer" />)
          : papers.map((paper: any, index: number) => (
              <motion.div
                key={paper.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="glass-card p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {paper.category && <span className="category-pill">{paper.category}</span>}
                      {paper.publicationDate && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {formatRelativeTime(paper.publicationDate)}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-sm leading-snug mb-2 hover:text-brand-300 transition-colors">
                      {paper.title}
                    </h3>

                    {/* Authors */}
                    {paper.authors?.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                        <Users className="w-3 h-3" />
                        <span>{paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 && ` et al.`}</span>
                      </div>
                    )}

                    {/* AI Summary */}
                    {paper.aiSummary ? (
                      <div className="bg-brand-600/5 border border-brand-500/10 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 text-[10px] text-brand-400 font-medium mb-1.5">
                          ✨ AI SUMMARY
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{paper.aiSummary}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{paper.abstract}</p>
                    )}
                  </div>

                  <a href={paper.link} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                    <button className="p-2 rounded-lg border border-white/[0.06] text-muted-foreground hover:text-foreground hover:border-white/10 transition-all mt-0.5">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </a>
                </div>
              </motion.div>
            ))}
      </div>
    </div>
  );
}
