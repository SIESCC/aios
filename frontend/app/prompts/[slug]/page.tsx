"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Star, Copy, TrendingUp } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function PromptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [copied, setCopied] = useState(false);

  const { data: prompt, isLoading, isError } = useQuery({
    queryKey: ["prompt", slug],
    queryFn: () => api.prompts.get(slug),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-[800px] mx-auto space-y-6 animate-pulse">
        <div className="h-32 rounded-xl bg-white/[0.04]" />
        <div className="h-64 rounded-xl bg-white/[0.04]" />
      </div>
    );
  }

  if (isError || !prompt) {
    return (
      <div className="p-6 max-w-[800px] mx-auto text-center py-20">
        <h2 className="text-2xl font-bold mb-2">Prompt not found</h2>
        <p className="text-muted-foreground mb-6">The prompt you are looking for doesn't exist.</p>
        <button onClick={() => router.back()} className="btn-neon text-white">
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </button>
      </div>
    );
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt.promptText);
    setCopied(true);
    fetch(`/api/prompts/${prompt.id}/copy`, { method: "POST" }).catch(() => {});
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-8 animate-in fade-in duration-500">
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to prompts
      </button>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card p-8 space-y-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <span className="category-pill inline-block mb-3">{prompt.category}</span>
            <h1 className="text-2xl md:text-3xl font-bold font-display">{prompt.title}</h1>
            <p className="text-muted-foreground mt-2">{prompt.description}</p>
          </div>
        </div>

        <div className="relative z-10 bg-black/40 rounded-xl border border-white/[0.04] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-b border-white/[0.02]">
            <span className="text-xs font-mono text-muted-foreground flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" /> Text
            </span>
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                copied 
                  ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                  : "bg-white/[0.04] text-muted-foreground border border-white/[0.06] hover:text-white"
              )}
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? "Copied!" : "Copy Prompt"}
            </button>
          </div>
          <div className="p-5 font-mono text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
            {prompt.promptText}
          </div>
        </div>

        {prompt.usageExample && (
          <div className="relative z-10">
            <h3 className="text-sm font-semibold mb-2">Usage Example / Context</h3>
            <p className="text-sm text-muted-foreground bg-white/[0.02] p-4 rounded-lg border border-white/[0.04] leading-relaxed">
              {prompt.usageExample}
            </p>
          </div>
        )}

        <div className="relative z-10 flex flex-wrap items-center justify-between pt-4 border-t border-white/[0.06] gap-4">
          <div className="flex flex-wrap gap-2">
            {prompt.tags?.map((tag: string) => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-muted-foreground">
                #{tag}
              </span>
            ))}
          </div>
          
          <div className="flex items-center gap-4 border-l border-white/[0.06] pl-4">
            <div className="flex justify-center items-center gap-1 text-yellow-400">
              <Star className="w-4 h-4 fill-yellow-400" />
              <span className="text-sm font-semibold font-mono">{prompt.rating?.toFixed(1) || "New"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-neon-orange">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-semibold">{prompt.copyCount} uses</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
