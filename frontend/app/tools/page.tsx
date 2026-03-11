"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Zap, Star, TrendingUp, ArrowUpRight, Grid, List } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { cn, PRICING_COLORS, formatNumber } from "@/lib/utils";

const CATEGORIES = [
  "All", "Chatbots", "Image Generation", "Code Assistants", "Search",
  "Video", "Audio", "Writing", "Productivity", "Data & Analytics",
];
const PRICING = ["All", "Free", "Freemium", "Paid", "Enterprise"];
const SORT_OPTIONS = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Top Rated" },
];

export default function ToolsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [pricing, setPricing] = useState("");
  const [sort, setSort] = useState("trending");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [compareList, setCompareList] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["tools", { search, category, pricing, sort, page }],
    queryFn: () => api.tools.list({
      ...(search && { search }),
      ...(category && category !== "All" && { category }),
      ...(pricing && pricing !== "All" && { pricing }),
      sort, page: String(page), limit: "24",
    }),
  });

  const tools = data?.tools || [];
  const pagination = data?.pagination;

  const toggleCompare = (id: string) => {
    setCompareList(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Zap className="w-6 h-6 text-brand-400" />
            AI Tool Discovery
          </h1>
          <p className="text-sm text-muted-foreground">Discover the best AI tools for every task</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={cn("p-2 rounded-lg border transition-all", viewMode === "grid" ? "border-brand-500/40 bg-brand-600/20 text-brand-400" : "border-white/[0.06] text-muted-foreground hover:text-foreground")}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn("p-2 rounded-lg border transition-all", viewMode === "list" ? "border-brand-500/40 bg-brand-600/20 text-brand-400" : "border-white/[0.06] text-muted-foreground hover:text-foreground")}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass-card p-4 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search AI tools..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-brand-500/40 transition-colors"
            />
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-foreground focus:outline-none focus:border-brand-500/40"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategory(cat === "All" ? "" : cat); setPage(1); }}
              className={cn("category-pill", (cat === "All" && !category) || cat === category ? "active" : "")}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Pricing Filter */}
        <div className="flex gap-2">
          {PRICING.map(p => (
            <button
              key={p}
              onClick={() => { setPricing(p === "All" ? "" : p); setPage(1); }}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                (p === "All" && !pricing) || p === pricing
                  ? "border-brand-500/40 bg-brand-600/20 text-brand-300"
                  : "border-white/[0.06] text-muted-foreground hover:text-foreground"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Compare Bar */}
      <AnimatePresence>
        {compareList.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 glass-card px-6 py-3 flex items-center gap-4 border-brand-500/30"
          >
            <span className="text-sm font-medium">{compareList.length} tools selected</span>
            <Link href={`/compare?ids=${compareList.join(",")}`}>
              <button className="btn-neon text-white">Compare Now</button>
            </Link>
            <button onClick={() => setCompareList([])} className="text-muted-foreground hover:text-foreground text-xs">
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tools Grid */}
      {isLoading ? (
        <div className={viewMode === "grid" ? "tools-grid" : "space-y-3"}>
          {Array(12).fill(0).map((_, i) => (
            <div key={i} className="h-48 rounded-xl shimmer" />
          ))}
        </div>
      ) : (
        <div className={viewMode === "grid" ? "tools-grid" : "space-y-3"}>
          {tools.map((tool: any, index: number) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              index={index}
              viewMode={viewMode}
              isComparing={compareList.includes(tool.id)}
              onCompare={toggleCompare}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          {Array.from({ length: Math.min(7, pagination.pages) }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn(
                "w-9 h-9 rounded-lg text-sm font-medium transition-all",
                p === page
                  ? "bg-brand-600/30 border border-brand-500/40 text-brand-300"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ToolCard({ tool, index, viewMode, isComparing, onCompare }: {
  tool: any; index: number; viewMode: "grid" | "list";
  isComparing: boolean; onCompare: (id: string) => void;
}) {
  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        className="glass-card p-4 flex items-center gap-4"
      >
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-600/30 to-purple-600/20 border border-white/[0.06] flex items-center justify-center flex-shrink-0 overflow-hidden">
          {tool.logoUrl ? <img src={tool.logoUrl} alt={tool.name} className="w-full h-full object-cover" /> : <span className="text-sm">{tool.name[0]}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">{tool.name}</p>
            <span className={cn("text-xs px-1.5 py-0.5 rounded border font-medium", PRICING_COLORS[tool.pricing] || "text-muted-foreground bg-muted")}>{tool.pricing}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{tool.tagline}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{tool.category}</span>
          <div className="flex items-center gap-1 text-neon-orange text-xs">
            <TrendingUp className="w-3 h-3" />
            <span>{tool.trendingScore.toFixed(0)}</span>
          </div>
          <Link href={`/tools/${tool.slug}`}>
            <button className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition-all">
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="glass-card p-4 flex flex-col gap-3 group"
    >
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600/30 to-purple-600/20 border border-white/[0.06] flex items-center justify-center overflow-hidden">
          {tool.logoUrl ? <img src={tool.logoUrl} alt={tool.name} className="w-full h-full object-cover" /> : <span>{tool.name[0]}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onCompare(tool.id)}
            className={cn(
              "text-xs px-2 py-1 rounded border transition-all",
              isComparing
                ? "border-brand-500/40 bg-brand-600/20 text-brand-300"
                : "border-white/[0.06] text-muted-foreground hover:border-white/[0.12]"
            )}
          >
            {isComparing ? "✓ Added" : "+ Compare"}
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm group-hover:text-brand-300 transition-colors">{tool.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tool.tagline}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="category-pill text-[10px]">{tool.category}</span>
        <span className={cn("text-[10px] px-2 py-0.5 rounded border", PRICING_COLORS[tool.pricing] || "text-muted-foreground")}>{tool.pricing}</span>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
        <div className="flex items-center gap-1 text-neon-orange">
          <TrendingUp className="w-3 h-3" />
          <span className="text-xs font-mono">{tool.trendingScore.toFixed(0)}</span>
        </div>
        {tool.apiAvailable && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/20 text-cyan-400">API</span>
        )}
        <Link href={`/tools/${tool.slug}`}>
          <button className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
            Details <ArrowUpRight className="w-3 h-3" />
          </button>
        </Link>
      </div>
    </motion.div>
  );
}
