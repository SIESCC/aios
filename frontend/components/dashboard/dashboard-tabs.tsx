"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Assuming we pass in the rendered ReactNode for each component
export function DashboardTabs({
  overviewStats,
  trendingTools,
  newsFeed,
  latestPapers,
  trendingRepos,
  fundingNews,
  categoryChart,
}: {
  overviewStats: React.ReactNode;
  trendingTools: React.ReactNode;
  newsFeed: React.ReactNode;
  latestPapers: React.ReactNode;
  trendingRepos: React.ReactNode;
  fundingNews: React.ReactNode;
  categoryChart: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "tools", label: "Tools & Repos" },
    { id: "research", label: "Research & News" },
    { id: "startups", label: "Startups & Funding" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-white/[0.06] pb-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "bg-white/[0.04] text-neon-green border-b-2 border-neon-green"
                : "text-muted-foreground hover:text-white hover:bg-white/[0.02]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {overviewStats}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {trendingTools}
              {categoryChart}
            </div>
          </div>
        )}

        {activeTab === "tools" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {trendingTools}
              {trendingRepos}
            </div>
          </div>
        )}

        {activeTab === "research" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {latestPapers}
              {newsFeed}
            </div>
          </div>
        )}

        {activeTab === "startups" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {fundingNews}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
