"use client";

import Link from "next/link";
import { BookOpen, ArrowUpRight, Users } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface Paper {
  id: string; title: string; authors: string[];
  aiSummary?: string; publicationDate?: string; category?: string;
}

export function LatestPapers({ papers }: { papers: Paper[] }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="section-header-line" />
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-neon-cyan" />
            <h2 className="font-semibold text-sm">Latest Research</h2>
          </div>
        </div>
        <Link href="/research" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
          View all <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {papers.length === 0
          ? Array(4).fill(0).map((_, i) => <div key={i} className="h-24 rounded-xl shimmer" />)
          : papers.map((paper) => (
              <Link key={paper.id} href={`/research/${paper.id}`}>
                <div className="p-3 rounded-xl hover:bg-white/[0.03] border border-transparent hover:border-white/[0.05] transition-all group cursor-pointer">
                  <div className="flex items-start gap-2 mb-1.5">
                    {paper.category && (
                      <span className="category-pill">{paper.category}</span>
                    )}
                    {paper.publicationDate && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatRelativeTime(paper.publicationDate)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium leading-snug group-hover:text-brand-300 transition-colors line-clamp-2 mb-1.5">
                    {paper.title}
                  </p>
                  {paper.aiSummary && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {paper.aiSummary}
                    </p>
                  )}
                  {paper.authors?.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground truncate">
                        {paper.authors.slice(0, 2).join(", ")}
                        {paper.authors.length > 2 && ` +${paper.authors.length - 2}`}
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
