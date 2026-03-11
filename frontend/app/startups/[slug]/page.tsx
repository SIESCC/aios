"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, DollarSign, Users, Globe, Building2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { cn, formatFunding, formatDate } from "@/lib/utils";

const ROUND_COLORS: Record<string, string> = {
  SEED: "text-green-400 bg-green-400/10 border-green-400/20",
  PRE_SEED: "text-teal-400 bg-teal-400/10 border-teal-400/20",
  SERIES_A: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  SERIES_B: "text-brand-400 bg-brand-400/10 border-brand-400/20",
  SERIES_C: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  SERIES_D_PLUS: "text-pink-400 bg-pink-400/10 border-pink-400/20",
  IPO: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
};

export default function StartupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { data: startup, isLoading, isError } = useQuery({
    queryKey: ["startup", slug],
    // We didn't explicitly add startup details in api.ts, so we fetch directly if needed
    queryFn: async () => {
      const res = await fetch(`/api/startups/${slug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
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

  if (isError || !startup) {
    return (
      <div className="p-6 max-w-[1000px] mx-auto text-center py-20">
        <h2 className="text-2xl font-bold mb-2">Startup not found</h2>
        <p className="text-muted-foreground mb-6">The startup you are looking for doesn't exist.</p>
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
        <ArrowLeft className="w-4 h-4" /> Back to startups
      </button>

      {/* Hero Section */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-green-600/30 to-teal-600/20 border border-white/[0.06] flex items-center justify-center flex-shrink-0">
            {startup.logoUrl ? (
              <img src={startup.logoUrl} alt={startup.name} className="w-16 h-16 object-contain" />
            ) : (
              <span className="text-3xl font-bold">{startup.name[0]}</span>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{startup.name}</h1>
              <span className={cn("text-xs px-2 py-1 rounded border font-medium flex-shrink-0", ROUND_COLORS[startup.fundingRound] || "text-muted-foreground bg-muted border-transparent")}>
                {startup.fundingRound?.replace("_", " ")}
              </span>
            </div>
            
            <p className="text-lg text-muted-foreground mb-4">{startup.description}</p>
            
            <div className="flex flex-wrap items-center gap-3">
              <a href={startup.website} target="_blank" rel="noopener noreferrer">
                <button className="btn-neon text-white flex items-center gap-2">
                  Visit Website <ExternalLink className="w-4 h-4" />
                </button>
              </a>
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
            className="glass-card p-6 space-y-6"
          >
            <h2 className="text-xl font-bold flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Funding Details
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-black/30 border border-white/[0.04]">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Funding</p>
                <div className="flex items-center gap-2 text-2xl font-bold font-mono text-neon-green">
                  {startup.fundingAmount ? formatFunding(Number(startup.fundingAmount)) : "Undisclosed"}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-black/30 border border-white/[0.04]">
                <p className="text-sm font-medium text-muted-foreground mb-1">Latest Round</p>
                <div className="flex items-center gap-2 text-xl font-bold">
                  {startup.fundingRound?.replace("_", " ")}
                </div>
              </div>
            </div>

            {startup.investors?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Key Investors
                </h3>
                <div className="flex flex-wrap gap-2">
                  {startup.investors.map((investor: string) => (
                    <span key={investor} className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm flex items-center gap-2">
                      <Building2 className="w-3 h-3 text-muted-foreground" />
                      {investor}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 space-y-6"
          >
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Location
              </h3>
              <p className="font-medium">{startup.country || "Global"}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Industry / Sector</h3>
              <span className="category-pill inline-block">{startup.industry || "AI"}</span>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Trending Score</h3>
              <div className="flex items-center gap-1.5 px-3 py-1.5 w-fit rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <TrendingUp className="w-4 h-4 text-neon-orange" />
                <span className="text-sm font-bold">{startup.trendingScore?.toFixed(0) || 50}</span>
              </div>
            </div>

            {startup.tags?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {startup.tags.map((tag: string) => (
                    <span key={tag} className="text-[10px] px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-muted-foreground cursor-default">
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
