"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, BookOpen, Users, Calendar, FileText, TrendingUp, Quote, Tag, Download } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function ResearchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: paper, isLoading, isError } = useQuery({
    queryKey: ["paper", id],
    queryFn: () => api.research.get(id),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-[900px] mx-auto space-y-6 animate-pulse">
        <div className="h-40 rounded-xl bg-white/[0.04]" />
        <div className="h-64 rounded-xl bg-white/[0.04]" />
      </div>
    );
  }

  if (isError || !paper) {
    return (
      <div className="p-6 max-w-[900px] mx-auto text-center py-20">
        <h2 className="text-2xl font-bold mb-2">Paper not found</h2>
        <p className="text-muted-foreground mb-6">The research paper you are looking for doesn&apos;t exist.</p>
        <button onClick={() => router.back()} className="btn-neon text-white">
          <ArrowLeft className="w-4 h-4 mr-2 inline" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[900px] mx-auto space-y-8 animate-in fade-in duration-500">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to research
      </button>

      {/* Paper Header */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {paper.source && (
              <span className="text-xs px-2 py-1 rounded bg-brand-600/20 text-brand-300 border border-brand-500/20 font-mono uppercase tracking-wider">
                {paper.source}
              </span>
            )}
            {paper.category && (
              <span className="category-pill">{paper.category}</span>
            )}
            {paper.arxivId && (
              <span className="text-xs px-2 py-1 rounded bg-white/[0.04] border border-white/[0.06] text-muted-foreground font-mono">
                {paper.arxivId}
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-4">{paper.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{paper.authors?.join(", ")}</span>
            </div>
            {paper.publicationDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(paper.publicationDate)}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {paper.link && (
              <a href={paper.link} target="_blank" rel="noopener noreferrer">
                <button className="btn-neon text-white flex items-center gap-2">
                  Read Paper <ExternalLink className="w-4 h-4" />
                </button>
              </a>
            )}
            {paper.pdfLink && (
              <a href={paper.pdfLink} target="_blank" rel="noopener noreferrer">
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm font-medium text-foreground hover:bg-white/[0.06] transition-all">
                  <Download className="w-4 h-4" /> Download PDF
                </button>
              </a>
            )}
            <div className="flex items-center gap-4 ml-auto">
              {paper.citationCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  <Quote className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-bold">{paper.citationCount.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">citations</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <TrendingUp className="w-4 h-4 text-neon-orange" />
                <span className="text-sm font-bold">{paper.trendingScore?.toFixed(0) || 0}</span>
                <span className="text-xs text-muted-foreground">score</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Summary */}
      {paper.aiSummary && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-neon-cyan" />
            AI Summary
          </h2>
          <div className="p-4 rounded-lg bg-neon-cyan/5 border border-neon-cyan/10">
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{paper.aiSummary}</p>
          </div>
        </motion.div>
      )}

      {/* Abstract */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-brand-400" />
          Abstract
        </h2>
        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{paper.abstract}</p>
      </motion.div>

      {/* Tags */}
      {paper.tags?.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Tag className="w-5 h-5 text-purple-400" />
            Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {paper.tags.map((tag: string) => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-muted-foreground hover:text-white transition-colors cursor-default">
                #{tag}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
