"use client";

import { Newspaper, ExternalLink } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface NewsItem {
  id: string; title: string; summary: string; url: string;
  source: string; publishedAt?: string;
}

export function NewsFeed({ news }: { news: NewsItem[] }) {
  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center gap-3 mb-5">
        <div className="section-header-line" />
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-neon-orange" />
          <h2 className="font-semibold text-sm">AI News Feed</h2>
        </div>
      </div>

      <div className="space-y-0 divide-y divide-white/[0.04]">
        {news.length === 0
          ? Array(6).fill(0).map((_, i) => <div key={i} className="py-3 h-20 shimmer rounded-xl mb-2" />)
          : news.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block py-3 group"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-muted-foreground">
                    {item.source}
                  </span>
                  {item.publishedAt && (
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {formatRelativeTime(item.publishedAt)}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium leading-snug group-hover:text-brand-300 transition-colors line-clamp-2 flex items-start gap-1.5">
                  {item.title}
                  <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
              </a>
            ))}
      </div>
    </div>
  );
}
