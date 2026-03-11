"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Star, TrendingUp, Zap, Server, Code, CheckCircle2, BookOpen } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { cn, PRICING_COLORS } from "@/lib/utils";

export default function ToolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { data: tool, isLoading, isError } = useQuery({
    queryKey: ["tool", slug],
    queryFn: () => api.tools.get(slug),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-[1000px] mx-auto space-y-6 animate-pulse">
        <div className="h-40 rounded-xl bg-white/[0.04]" />
        <div className="h-64 rounded-xl bg-white/[0.04]" />
      </div>
    );
  }

  if (isError || !tool) {
    return (
      <div className="p-6 max-w-[1000px] mx-auto text-center py-20">
        <h2 className="text-2xl font-bold mb-2">Tool not found</h2>
        <p className="text-muted-foreground mb-6">The AI tool you are looking for doesn't exist or was removed.</p>
        <button onClick={() => router.back()} className="btn-neon text-white">
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-8 animate-in fade-in duration-500">
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to tools
      </button>

      {/* Hero Section */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card p-8 relative overflow-hidden"
      >
        {/* Abstract background blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-600/30 to-purple-600/20 border border-white/[0.06] flex items-center justify-center flex-shrink-0">
            {tool.logoUrl ? (
              <img src={tool.logoUrl} alt={tool.name} className="w-16 h-16 object-contain" />
            ) : (
              <span className="text-3xl font-bold">{tool.name[0]}</span>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{tool.name}</h1>
              {tool.status === "APPROVED" && (
                <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-wider font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
            
            <p className="text-lg text-muted-foreground mb-4">{tool.tagline}</p>
            
            <div className="flex flex-wrap items-center gap-3">
              <a href={tool.website} target="_blank" rel="noopener noreferrer">
                <button className="btn-neon text-white flex items-center gap-2">
                  Visit Website <ExternalLink className="w-4 h-4" />
                </button>
              </a>
              
              <div className="flex items-center gap-2 ml-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  <TrendingUp className="w-4 h-4 text-neon-orange" />
                  <span className="text-sm font-bold">{tool.trendingScore?.toFixed(0) || 50}</span>
                  <span className="text-xs text-muted-foreground">Score</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 space-y-4"
          >
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-400" />
              About {tool.name}
            </h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {tool.description}
              </p>
            </div>
          </motion.div>

          {/* Features / Capabilities */}
          {(tool.supportedTasks?.length > 0 || tool.features) && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-400" />
                Capabilities
              </h2>
              <div className="flex flex-wrap gap-2">
                {tool.supportedTasks?.map((task: string) => (
                  <span key={task} className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
                    {task.charAt(0).toUpperCase() + task.slice(1).replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6 space-y-6"
          >
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Category</h3>
              <span className="category-pill inline-block">{tool.category}</span>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Pricing Model</h3>
              <span className={cn("px-3 py-1 rounded-full text-sm font-medium border inline-block", PRICING_COLORS[tool.pricing] || "bg-muted text-muted-foreground")}>
                {tool.pricing}
              </span>
            </div>

            {tool.apiAvailable && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Developer API</h3>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-sm font-medium">
                  <Code className="w-4 h-4" /> API Available
                </span>
              </div>
            )}

            {tool.tags?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {tool.tags.map((tag: string) => (
                    <span key={tag} className="text-xs px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-muted-foreground hover:text-white transition-colors cursor-default">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
