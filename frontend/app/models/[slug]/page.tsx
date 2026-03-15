"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Brain, Cpu, Code, Gauge, Layers, CheckCircle2, Globe, Server } from "lucide-react";
import { api } from "@/lib/api";
import { cn, MODEL_TYPE_COLORS, formatDate } from "@/lib/utils";

export default function ModelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { data: model, isLoading, isError } = useQuery({
    queryKey: ["model", slug],
    queryFn: () => api.models.get(slug),
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

  if (isError || !model) {
    return (
      <div className="p-6 max-w-[1000px] mx-auto text-center py-20">
        <h2 className="text-2xl font-bold mb-2">Model not found</h2>
        <p className="text-muted-foreground mb-6">The AI model you are looking for doesn&apos;t exist or was removed.</p>
        <button onClick={() => router.back()} className="btn-neon text-white">
          <ArrowLeft className="w-4 h-4 mr-2 inline" /> Go Back
        </button>
      </div>
    );
  }

  const benchmarks = model.benchmarks as Record<string, number> | null;

  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-8 animate-in fade-in duration-500">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to models
      </button>

      {/* Hero Section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-600/30 to-brand-600/20 border border-white/[0.06] flex items-center justify-center flex-shrink-0">
            <Brain className="w-12 h-12 text-purple-400" />
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{model.name}</h1>
              <span className={cn("text-xs px-2.5 py-1 rounded-full border font-medium", MODEL_TYPE_COLORS[model.modelType] || "text-muted-foreground")}>
                {model.modelType}
              </span>
              {model.openSource && (
                <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-wider font-semibold">
                  <Globe className="w-3 h-3" /> Open Source
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-1">by <span className="text-foreground font-medium">{model.organization}</span></p>
            <p className="text-lg text-muted-foreground mb-4">{model.description}</p>

            <div className="flex flex-wrap items-center gap-3">
              {model.website && (
                <a href={model.website} target="_blank" rel="noopener noreferrer">
                  <button className="btn-neon text-white flex items-center gap-2">
                    Visit Website <ExternalLink className="w-4 h-4" />
                  </button>
                </a>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <Gauge className="w-4 h-4 text-neon-orange" />
                <span className="text-sm font-bold">{model.trendingScore?.toFixed(0) || 0}</span>
                <span className="text-xs text-muted-foreground">Score</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Benchmarks */}
          {benchmarks && Object.keys(benchmarks).length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6 space-y-4"
            >
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Gauge className="w-5 h-5 text-neon-cyan" />
                Benchmark Scores
              </h2>
              <div className="space-y-4">
                {Object.entries(benchmarks).map(([name, score]) => (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium uppercase tracking-wide">{name}</span>
                      <span className="text-sm font-mono font-bold text-neon-cyan">{score}</span>
                    </div>
                    <div className="score-bar">
                      <div
                        className="score-bar-fill"
                        style={{ width: `${Math.min(score, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Capabilities */}
          {model.capabilities?.length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-yellow-400" />
                Capabilities
              </h2>
              <div className="flex flex-wrap gap-2">
                {model.capabilities.map((cap: string) => (
                  <span key={cap} className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
                    {cap.charAt(0).toUpperCase() + cap.slice(1)}
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
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Organization</h3>
              <span className="text-foreground font-medium">{model.organization}</span>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Model Type</h3>
              <span className={cn("px-3 py-1 rounded-full text-sm font-medium border inline-block", MODEL_TYPE_COLORS[model.modelType] || "bg-muted text-muted-foreground")}>
                {model.modelType}
              </span>
            </div>

            {model.parameterCount && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Parameters</h3>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm font-mono">
                  <Cpu className="w-4 h-4 text-brand-400" /> {model.parameterCount}
                </span>
              </div>
            )}

            {model.contextWindow && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Context Window</h3>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm font-mono">
                  <Server className="w-4 h-4 text-neon-cyan" /> {model.contextWindow?.toLocaleString()} tokens
                </span>
              </div>
            )}

            {model.apiAvailable && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">API Access</h3>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-sm font-medium">
                  <Code className="w-4 h-4" /> API Available
                </span>
              </div>
            )}

            {model.releaseDate && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Release Date</h3>
                <span className="text-sm text-foreground">{formatDate(model.releaseDate)}</span>
              </div>
            )}

            {model.architecture && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Architecture</h3>
                <span className="text-sm text-foreground">{model.architecture}</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
