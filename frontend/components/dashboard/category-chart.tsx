"use client";

import { BarChart2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const COLORS = ["#4f55ff", "#7c3aed", "#00f5ff", "#3d38f5", "#a855f7", "#06b6d4", "#8b5cf6", "#2563eb"];

export function CategoryChart() {
  const { data } = useQuery({
    queryKey: ["trend-categories"],
    queryFn: () => api.trends.categories(),
  });

  const chartData = data?.slice(0, 8).map((d: any) => ({
    name: d.category.replace(/([A-Z])/g, " $1").trim().split(" ").slice(0, 2).join(" "),
    count: d.count,
  })) || [];

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="section-header-line" />
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-brand-400" />
          <h2 className="font-semibold text-sm">Categories Distribution</h2>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-48 shimmer rounded-xl" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 20 }}>
            <XAxis
              dataKey="name"
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              angle={-30}
              textAnchor="end"
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(10,12,20,0.95)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "8px",
                fontSize: 12,
              }}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((_: any, index: number) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
