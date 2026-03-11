"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { GitCompare, Check, X, Minus } from "lucide-react";
import { api } from "@/lib/api";
import { cn, PRICING_COLORS } from "@/lib/utils";

function CompareContent() {
  const params = useSearchParams();
  const ids = params.get("ids")?.split(",").filter(Boolean) || [];

  const { data: tools, isLoading } = useQuery({
    queryKey: ["compare", ids],
    queryFn: () => ids.length >= 2 ? api.tools.compare(ids) : Promise.resolve([]),
    enabled: ids.length >= 2,
  });

  const COMPARISON_FIELDS = [
    { key: "pricing", label: "Pricing" },
    { key: "category", label: "Category" },
    { key: "contextWindow", label: "Context Window" },
    { key: "apiAvailable", label: "API Available", type: "boolean" },
    { key: "tags", label: "Tags", type: "tags" },
    { key: "supportedTasks", label: "Supported Tasks", type: "tags" },
    { key: "website", label: "Website", type: "link" },
  ];

  if (ids.length < 2) {
    return (
      <div className="p-6 text-center">
        <GitCompare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Select Tools to Compare</h2>
        <p className="text-muted-foreground text-sm">Go to the Tools page and select 2-5 tools to compare side by side.</p>
      </div>
    );
  }

  if (isLoading) return <div className="p-6 text-center text-muted-foreground">Loading comparison...</div>;

  const toolList = tools || [];

  return (
    <div className="p-6 space-y-6 overflow-x-auto">
      <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
        <GitCompare className="w-6 h-6 text-brand-400" />
        Tool Comparison
      </h1>

      {/* Header Row */}
      <div className="glass-card overflow-hidden">
        {/* Tool Cards */}
        <div className="grid border-b border-white/[0.05]" style={{ gridTemplateColumns: `200px repeat(${toolList.length}, 1fr)` }}>
          <div className="p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Feature</div>
          {toolList.map((tool: any) => (
            <div key={tool.id} className="p-4 border-l border-white/[0.05]">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600/30 to-purple-600/20 border border-white/[0.06] flex items-center justify-center overflow-hidden">
                  {tool.logoUrl ? <img src={tool.logoUrl} alt={tool.name} className="w-full h-full object-cover" /> : <span className="text-lg">{tool.name[0]}</span>}
                </div>
                <div>
                  <p className="font-bold text-sm">{tool.name}</p>
                  <p className="text-xs text-muted-foreground">{tool.tagline}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-neon-orange text-xs font-mono">⬆ {tool.trendingScore?.toFixed(0)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Rows */}
        {COMPARISON_FIELDS.map((field, idx) => (
          <div
            key={field.key}
            className={cn("grid border-b border-white/[0.03]", idx % 2 === 0 ? "" : "bg-white/[0.01]")}
            style={{ gridTemplateColumns: `200px repeat(${toolList.length}, 1fr)` }}
          >
            <div className="p-4 text-sm text-muted-foreground font-medium flex items-center">{field.label}</div>
            {toolList.map((tool: any) => {
              const value = tool[field.key];
              return (
                <div key={tool.id} className="p-4 border-l border-white/[0.03] flex items-center justify-center">
                  {field.type === "boolean" ? (
                    value ? <Check className="w-5 h-5 text-neon-green" /> : <X className="w-5 h-5 text-red-400" />
                  ) : field.type === "tags" ? (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {Array.isArray(value) && value.slice(0, 3).map((v: string) => (
                        <span key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-muted-foreground capitalize">{v}</span>
                      ))}
                    </div>
                  ) : field.type === "link" ? (
                    value ? <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-400 hover:text-brand-300 underline truncate max-w-[120px]">{value.replace(/^https?:\/\//, "")}</a> : <Minus className="w-4 h-4 text-muted-foreground" />
                  ) : field.key === "pricing" ? (
                    <span className={cn("text-xs px-2 py-0.5 rounded border font-medium", PRICING_COLORS[value] || "text-muted-foreground")}>{value || "—"}</span>
                  ) : (
                    <span className="text-sm text-center">{value || <Minus className="w-4 h-4 text-muted-foreground" />}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <CompareContent />
    </Suspense>
  );
}
