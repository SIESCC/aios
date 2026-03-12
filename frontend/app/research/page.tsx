"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, ChevronDown, ChevronUp, ExternalLink, Award,
  Brain, Lightbulb, Target, Sparkles, Search
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";

export default function ResearchPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["research", search, category, sort],
    queryFn: () => api.research.list({ search, category, sort }),
  });

  const papers = data?.papers || [];

  // AI-generated simplified summary breakdown
  const generateSimplifiedView = (paper: any) => {
    const sections = [];
    // Main idea - from abstract
    sections.push({
      icon: Brain,
      title: "Main Idea",
      content: paper.aiSummary || paper.abstract?.slice(0, 200) + "...",
      color: "text-brand-400",
    });
    // Key innovations
    sections.push({
      icon: Lightbulb,
      title: "Key Innovations",
      content: paper.aiSummary
        ? "This research introduces novel approaches that advance the field. See the AI-generated summary above for details."
        : "New methodologies and techniques are explored in this paper.",
      color: "text-yellow-400",
    });
    // Real-world applications
    sections.push({
      icon: Target,
      title: "Real-World Applications",
      content: paper.tags?.length > 0
        ? `Applications in: ${paper.tags.join(", ")}. This research has potential impact across multiple industries.`
        : "This research has broad applications across AI systems and related technologies.",
      color: "text-green-400",
    });
    // Impact
    sections.push({
      icon: Award,
      title: "Impact on AI Industry",
      content: paper.citationCount > 50
        ? `Highly influential with ${paper.citationCount}+ citations. This paper has significantly shaped the AI landscape.`
        : paper.citationCount > 0
        ? `Growing influence with ${paper.citationCount} citations and counting.`
        : "Emerging research with potential for significant impact.",
      color: "text-purple-400",
    });
    return sections;
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-cyan-400" />
          AI Research Hub
        </h1>
        <p className="text-sm text-muted-foreground">Research papers simplified with AI-powered summaries</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search research papers..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm focus:outline-none focus:border-brand-400/40"
          />
        </div>
        <div className="flex gap-2">
          {["newest", "trending", "cited"].map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-medium border transition-colors capitalize",
                sort === s
                  ? "border-brand-500/40 bg-brand-600/20 text-brand-300"
                  : "border-white/[0.06] text-muted-foreground hover:text-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Papers */}
      <div className="space-y-4">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-6 h-32 shimmer" />
          ))
        ) : papers.map((paper: any, index: number) => {
          const isExpanded = expandedId === paper.id;
          const simplified = generateSimplifiedView(paper);

          return (
            <motion.div
              key={paper.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card overflow-hidden"
            >
              {/* Paper Header */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {paper.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 uppercase font-mono">
                          {paper.category}
                        </span>
                      )}
                      {paper.citationCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400">
                          {paper.citationCount} citations
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm leading-relaxed">{paper.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {paper.authors?.slice(0, 3).join(", ")}{paper.authors?.length > 3 ? " et al." : ""}
                      {paper.publicationDate && ` · ${formatDate(paper.publicationDate)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {paper.link && (
                      <a href={paper.link} target="_blank" rel="noopener" className="w-8 h-8 glass-card flex items-center justify-center hover:border-cyan-400/40 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* AI Summary Badge */}
                {paper.aiSummary && (
                  <div className="mt-3 p-3 rounded-lg bg-brand-600/5 border border-brand-400/10">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-3 h-3 text-brand-400" />
                      <span className="text-[10px] font-semibold text-brand-400 uppercase">AI Summary</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{paper.aiSummary}</p>
                  </div>
                )}

                {/* Expand Button */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : paper.id)}
                  className="mt-3 flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  {isExpanded ? "Hide" : "Show"} Simplified Breakdown
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* Simplified Breakdown */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-white/[0.04] pt-4">
                      {simplified.map((section, si) => (
                        <motion.div
                          key={section.title}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: si * 0.1 }}
                          className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <section.icon className={`w-4 h-4 ${section.color}`} />
                            <span className="text-xs font-semibold">{section.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{section.content}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {papers.length === 0 && !isLoading && (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No papers found. Try a different search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
