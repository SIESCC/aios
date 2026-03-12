"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Zap, Star, ExternalLink, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

export function RecommendSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async () => {
    if (!query.trim() || query.trim().length < 3) return;
    setLoading(true);
    setShowResults(true);
    try {
      const data = await apiFetch(`/recommend?q=${encodeURIComponent(query.trim())}&limit=8`);
      setResults(data);
    } catch {
      setResults(null);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="relative">
      {/* Search Bar */}
      <div className="glass-card p-1 flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 text-brand-400">
          <Sparkles className="w-4 h-4" />
        </div>
        <input
          id="recommend-search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Try "best AI tools for video editing" or "AI tools for coding assistance"'
          className="flex-1 bg-transparent py-3 text-sm focus:outline-none placeholder:text-muted-foreground/60"
        />
        <button
          onClick={handleSearch}
          disabled={loading || query.length < 3}
          className="btn-neon text-xs mr-1 disabled:opacity-40 flex items-center gap-1.5"
        >
          <Search className="w-3.5 h-3.5" />
          {loading ? "Searching..." : "Find Tools"}
        </button>
      </div>

      {/* Results Panel */}
      <AnimatePresence>
        {showResults && results && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-3 glass-card overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span className="text-xs font-medium">
                  {results.recommendations?.length || 0} recommendations for &quot;{results.query}&quot;
                </span>
                {results.matchedCategories?.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-400/10 border border-brand-400/20 text-brand-400">
                    {results.matchedCategories.join(", ")}
                  </span>
                )}
              </div>
              <button onClick={() => setShowResults(false)} className="text-muted-foreground hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-white/[0.03] max-h-[400px] overflow-y-auto">
              {results.recommendations?.map((tool: any, i: number) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors group"
                >
                  <span className="text-xs font-mono text-muted-foreground w-5 text-right">{i + 1}</span>
                  {tool.logoUrl ? (
                    <img src={tool.logoUrl} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-600/30 to-purple-600/30 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {tool.name?.[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link href={`/tools/${tool.slug}`} className="text-sm font-semibold group-hover:text-brand-300 transition-colors">
                      {tool.name}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">{tool.tagline}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] category-pill">{tool.category}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-muted-foreground">{tool.pricing}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span className="text-xs font-mono">{tool.relevanceScore?.toFixed(0)}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">relevance</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
