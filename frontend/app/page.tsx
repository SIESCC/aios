import type { Metadata } from "next";
import { api } from "@/lib/api";
import { StatsBar } from "@/components/dashboard/stats-bar";
import { TrendingTools } from "@/components/dashboard/trending-tools";
import { LatestPapers } from "@/components/dashboard/latest-papers";
import { TrendingRepos } from "@/components/dashboard/trending-repos";
import { FundingNews } from "@/components/dashboard/funding-news";
import { NewsFeed } from "@/components/dashboard/news-feed";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { Activity, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Real-time intelligence dashboard for the global AI ecosystem",
};

export const revalidate = 300; // Revalidate every 5 minutes

async function getDashboardData() {
  try {
    const [overview, latestPapers, trendingRepos, fundingNews, news] = await Promise.all([
      api.trends.overview(),
      api.research.latest(),
      api.repos.trending(),
      api.startups.latestFunding(),
      api.trends.news(8),
    ]);
    return { overview, latestPapers, trendingRepos, fundingNews, news };
  } catch {
    return { overview: null, latestPapers: [], trendingRepos: [], fundingNews: [], news: [] };
  }
}

export default async function DashboardPage() {
  const { overview, latestPapers, trendingRepos, fundingNews, news } = await getDashboardData();

  return (
    <div className="p-6 space-y-6 max-w-[1600px]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-mono text-green-400">LIVE</span>
          </div>
          <h1 className="text-2xl font-bold gradient-text">AI Ecosystem Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time intelligence across the global AI landscape
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 glass-card text-xs text-muted-foreground font-mono">
          <Activity className="w-3 h-3 text-neon-green" />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <DashboardTabs 
        overviewStats={<StatsBar stats={overview?.stats} />}
        trendingTools={<TrendingTools tools={overview?.trendingTools || []} />}
        newsFeed={<NewsFeed news={news} />}
        latestPapers={<LatestPapers papers={latestPapers} />}
        trendingRepos={<TrendingRepos repos={trendingRepos} />}
        fundingNews={<FundingNews startups={fundingNews} />}
        categoryChart={<CategoryChart />}
      />
    </div>
  );
}
