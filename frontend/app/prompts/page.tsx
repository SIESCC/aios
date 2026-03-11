"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BookOpen, Copy, Star, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { cn, formatRelativeTime } from "@/lib/utils";

const CATEGORIES = ["All", "Development", "Research", "Business", "Creative", "Marketing", "Data Science", "Education"];

export default function PromptsPage() {
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("rating");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["prompts", { category, sort }],
    queryFn: () => api.prompts.list({
      ...(category && category !== "All" && { category }),
      sort, limit: "30",
    }),
  });

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    // Track copy count
    fetch(`/api/prompts/${id}/copy`, { method: "POST" }).catch(() => {});
    setTimeout(() => setCopiedId(null), 2000);
  };

  const prompts = data?.prompts || [];

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-cyan-400" />
          AI Prompt Library
        </h1>
        <p className="text-sm text-muted-foreground">Curated prompts for every use case</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
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
        <div className="flex gap-2">
          {[{v: "rating", l: "Top Rated"}, {v: "newest", l: "Newest"}, {v: "copies", l: "Most Used"}].map(o => (
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

      {/* Submit Button */}
      <div className="flex justify-end">
        <Link href="/prompts/submit">
          <button className="btn-neon text-white">+ Submit Prompt</button>
        </Link>
      </div>

      {/* Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array(9).fill(0).map((_, i) => <div key={i} className="h-52 rounded-xl shimmer" />)
          : prompts.map((prompt: any, index: number) => (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="glass-card p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="category-pill text-[10px] mb-2 inline-block">{prompt.category}</span>
                    <h3 className="font-semibold text-sm leading-snug">{prompt.title}</h3>
                    {prompt.description && (
                      <p className="text-xs text-muted-foreground mt-1">{prompt.description}</p>
                    )}
                  </div>
                </div>

                {/* Prompt Preview */}
                <div className="bg-black/30 rounded-lg px-3 py-2.5 border border-white/[0.04] flex-1">
                  <p className="text-xs font-mono text-muted-foreground/80 line-clamp-4 leading-relaxed">
                    {prompt.promptText}
                  </p>
                </div>

                {/* Tags */}
                {prompt.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {prompt.tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-muted-foreground">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-3 h-3 fill-yellow-400" />
                    <span className="text-xs font-mono">{prompt.rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({prompt.copyCount})</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(prompt.id, prompt.promptText)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        copiedId === prompt.id
                          ? "border-green-500/40 bg-green-600/20 text-green-400"
                          : "border-white/[0.06] text-muted-foreground hover:text-foreground hover:border-white/10"
                      )}
                    >
                      <Copy className="w-3 h-3" />
                      {copiedId === prompt.id ? "Copied!" : "Copy"}
                    </button>
                    <Link href={`/prompts/${prompt.slug}`}>
                      <button className="px-3 py-1.5 rounded-lg text-xs border border-white/[0.06] text-muted-foreground hover:text-foreground transition-all">
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
      </div>
    </div>
  );
}
