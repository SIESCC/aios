"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, MessageSquare, GitBranch, BarChart2, Send,
  CheckCircle, Clock, FileText, Zap
} from "lucide-react";
import { api } from "@/lib/api";
import { cn, formatRelativeTime } from "@/lib/utils";

const SUBMISSION_TYPES = [
  { id: "TOOL_REVIEW", label: "Tool Review", icon: Zap, description: "Share your experience with an AI tool" },
  { id: "PROMPT", label: "AI Prompt", icon: MessageSquare, description: "Share useful prompts with the community" },
  { id: "WORKFLOW", label: "Workflow Template", icon: GitBranch, description: "Share an AI workflow template" },
  { id: "COMPARISON", label: "Tool Comparison", icon: BarChart2, description: "Compare two or more AI tools" },
];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<"browse" | "submit">("browse");
  const [submitType, setSubmitType] = useState("TOOL_REVIEW");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: submissions } = useQuery({
    queryKey: ["community-submissions"],
    queryFn: () => api.community.list(),
  });

  const { data: stats } = useQuery({
    queryKey: ["community-stats"],
    queryFn: api.community.stats,
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) => api.community.submit(data),
    onSuccess: () => {
      setSubmitted(true);
      setTitle("");
      setContent("");
      setTimeout(() => setSubmitted(false), 3000);
    },
  });

  const handleSubmit = () => {
    if (!title || !content) return;
    submitMutation.mutate({
      type: submitType,
      title,
      content,
      authorName: authorName || undefined,
      authorEmail: authorEmail || undefined,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
          <Users className="w-6 h-6 text-green-400" />
          Community Hub
        </h1>
        <p className="text-sm text-muted-foreground">Contribute reviews, prompts, workflows, and comparisons</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Reviews", value: stats?.totalReviews || 0, icon: Zap, color: "text-brand-400" },
          { label: "Prompts", value: stats?.totalPrompts || 0, icon: MessageSquare, color: "text-purple-400" },
          { label: "Workflows", value: stats?.totalWorkflows || 0, icon: GitBranch, color: "text-cyan-400" },
          { label: "Comparisons", value: stats?.totalComparisons || 0, icon: BarChart2, color: "text-orange-400" },
          { label: "Pending", value: stats?.pending || 0, icon: Clock, color: "text-yellow-400" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card p-4 text-center"
          >
            <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
            <p className="text-xl font-bold font-mono">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-2 border-b border-white/[0.06] pb-2">
        <button
          onClick={() => setActiveTab("browse")}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors",
            activeTab === "browse"
              ? "bg-white/[0.04] text-neon-green border-b-2 border-neon-green"
              : "text-muted-foreground hover:text-white"
          )}
        >
          Browse Contributions
        </button>
        <button
          onClick={() => setActiveTab("submit")}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors",
            activeTab === "submit"
              ? "bg-white/[0.04] text-neon-green border-b-2 border-neon-green"
              : "text-muted-foreground hover:text-white"
          )}
        >
          Submit Contribution
        </button>
      </div>

      {/* Browse */}
      {activeTab === "browse" && (
        <div className="space-y-4">
          {(submissions?.submissions || []).map((sub: any, i: number) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-400/10 border border-brand-400/20 text-brand-400 uppercase font-mono">
                      {sub.type.replace("_", " ")}
                    </span>
                    {sub.authorName && (
                      <span className="text-xs text-muted-foreground">by {sub.authorName}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm">{sub.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{sub.content}</p>
                </div>
                <span className="text-xs text-muted-foreground">{formatRelativeTime(sub.createdAt)}</span>
              </div>
            </motion.div>
          ))}
          {(!submissions?.submissions || submissions.submissions.length === 0) && (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No community contributions yet. Be the first!</p>
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      {activeTab === "submit" && (
        <div className="glass-card p-6 space-y-5 max-w-[700px]">
          <AnimatePresence>
            {submitted && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-green-400/10 border border-green-400/20 text-green-400 text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Submitted successfully! An admin will review your contribution.
              </motion.div>
            )}
          </AnimatePresence>

          {/* Type Selector */}
          <div className="grid grid-cols-2 gap-3">
            {SUBMISSION_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => setSubmitType(type.id)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all",
                  submitType === type.id
                    ? "border-brand-500/40 bg-brand-600/10"
                    : "border-white/[0.06] hover:border-white/10"
                )}
              >
                <type.icon className={cn("w-4 h-4 mb-1", submitType === type.id ? "text-brand-400" : "text-muted-foreground")} />
                <p className="text-sm font-medium">{type.label}</p>
                <p className="text-[10px] text-muted-foreground">{type.description}</p>
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="space-y-3">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400/40"
            />
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Content (your review, prompt, template, or comparison)"
              rows={6}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400/40 resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                placeholder="Your name (optional)"
                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400/40"
              />
              <input
                value={authorEmail}
                onChange={e => setAuthorEmail(e.target.value)}
                placeholder="Your email (optional)"
                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400/40"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!title || !content || submitMutation.isPending}
            className="btn-neon flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {submitMutation.isPending ? "Submitting..." : "Submit for Review"}
          </button>
        </div>
      )}
    </div>
  );
}
