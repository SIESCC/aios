"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, Plus, ArrowRight, Sparkles, Zap, Star, X } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const WORKFLOW_CATEGORIES = [
  "All", "Content Creation", "Marketing", "Coding", "Research", "Design", "Data Analysis", "General",
];

const STEP_COLORS = [
  "from-brand-500 to-purple-600",
  "from-purple-500 to-pink-600",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-blue-600",
  "from-green-500 to-emerald-600",
  "from-orange-500 to-amber-600",
];

const SUGGESTED_WORKFLOWS = [
  {
    title: "Content Creation Pipeline",
    description: "Full content creation from idea to published video",
    category: "Content Creation",
    steps: [
      { toolName: "ChatGPT", action: "Idea Generation", description: "Generate content ideas and outlines" },
      { toolName: "Claude", action: "Script Writing", description: "Write detailed scripts" },
      { toolName: "ElevenLabs", action: "Voice Generation", description: "Generate professional voiceovers" },
      { toolName: "Runway", action: "Video Creation", description: "Create and edit video content" },
    ],
  },
  {
    title: "Marketing Automation",
    description: "End-to-end marketing campaign workflow",
    category: "Marketing",
    steps: [
      { toolName: "ChatGPT", action: "Strategy Planning", description: "Define campaign goals and strategy" },
      { toolName: "Midjourney", action: "Visual Asset Creation", description: "Generate marketing visuals" },
      { toolName: "Claude", action: "Copy Writing", description: "Write ad copy and landing pages" },
      { toolName: "Jasper", action: "SEO Optimization", description: "Optimize content for search" },
    ],
  },
  {
    title: "Coding Assistant Pipeline",
    description: "Accelerated development with AI tools",
    category: "Coding",
    steps: [
      { toolName: "ChatGPT", action: "Architecture Design", description: "Plan system architecture" },
      { toolName: "Cursor", action: "Code Implementation", description: "Write code with AI assistance" },
      { toolName: "GitHub Copilot", action: "Code Completion", description: "Auto-complete and suggest code" },
      { toolName: "Claude", action: "Code Review", description: "Review and optimize code" },
    ],
  },
  {
    title: "Research Pipeline",
    description: "Research and analysis workflow",
    category: "Research",
    steps: [
      { toolName: "Perplexity", action: "Information Gathering", description: "Research and gather sources" },
      { toolName: "Claude", action: "Analysis", description: "Deep analysis of findings" },
      { toolName: "ChatGPT", action: "Report Writing", description: "Compile research reports" },
    ],
  },
];

export default function WorkflowsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderSteps, setBuilderSteps] = useState<Array<{ toolName: string; action: string; description: string }>>([
    { toolName: "", action: "", description: "" },
    { toolName: "", action: "", description: "" },
  ]);
  const [builderTitle, setBuilderTitle] = useState("");
  const [builderDescription, setBuilderDescription] = useState("");
  const [builderCategory, setBuilderCategory] = useState("General");

  const { data: workflowData } = useQuery({
    queryKey: ["workflows", activeCategory],
    queryFn: () => api.workflows.list(activeCategory !== "All" ? { category: activeCategory } : {}),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.workflows.create(data),
    onSuccess: () => {
      setShowBuilder(false);
      setBuilderSteps([{ toolName: "", action: "", description: "" }, { toolName: "", action: "", description: "" }]);
      setBuilderTitle("");
      setBuilderDescription("");
    },
  });

  const workflows = workflowData?.workflows || [];

  const addStep = () => {
    if (builderSteps.length < 10) {
      setBuilderSteps([...builderSteps, { toolName: "", action: "", description: "" }]);
    }
  };

  const removeStep = (index: number) => {
    if (builderSteps.length > 2) {
      setBuilderSteps(builderSteps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index: number, field: string, value: string) => {
    const updated = [...builderSteps];
    (updated[index] as any)[field] = value;
    setBuilderSteps(updated);
  };

  const handleCreate = () => {
    if (!builderTitle || builderSteps.some(s => !s.toolName || !s.action)) return;
    createMutation.mutate({
      title: builderTitle,
      description: builderDescription,
      category: builderCategory,
      steps: builderSteps,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-purple-400" />
            AI Workflow Builder
          </h1>
          <p className="text-sm text-muted-foreground">Create and discover AI tool workflows for any task</p>
        </div>
        <button onClick={() => setShowBuilder(!showBuilder)} className="btn-neon flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Workflow
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {WORKFLOW_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "category-pill",
              activeCategory === cat && "active"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Workflow Builder Modal */}
      <AnimatePresence>
        {showBuilder && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-400" />
                  Build Your Workflow
                </h2>
                <button onClick={() => setShowBuilder(false)} className="text-muted-foreground hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  value={builderTitle}
                  onChange={e => setBuilderTitle(e.target.value)}
                  placeholder="Workflow title"
                  className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400/40"
                />
                <input
                  value={builderDescription}
                  onChange={e => setBuilderDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400/40"
                />
                <select
                  value={builderCategory}
                  onChange={e => setBuilderCategory(e.target.value)}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400/40 text-muted-foreground"
                >
                  {WORKFLOW_CATEGORIES.filter(c => c !== "All").map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {builderSteps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${STEP_COLORS[i % STEP_COLORS.length]} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                      {i + 1}
                    </div>
                    <input
                      value={step.toolName}
                      onChange={e => updateStep(i, "toolName", e.target.value)}
                      placeholder="AI Tool (e.g. ChatGPT)"
                      className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400/40"
                    />
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <input
                      value={step.action}
                      onChange={e => updateStep(i, "action", e.target.value)}
                      placeholder="Action (e.g. Generate Script)"
                      className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400/40"
                    />
                    {builderSteps.length > 2 && (
                      <button onClick={() => removeStep(i)} className="text-red-400/60 hover:text-red-400">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button onClick={addStep} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add Step
                </button>
                <div className="flex-1" />
                <button
                  onClick={handleCreate}
                  disabled={!builderTitle || builderSteps.some(s => !s.toolName || !s.action)}
                  className="btn-neon text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Save Workflow
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggested Workflows */}
      <div>
        <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400" /> Recommended Workflows
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SUGGESTED_WORKFLOWS.filter(w => activeCategory === "All" || w.category === activeCategory).map((wf, wi) => (
            <motion.div
              key={wf.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: wi * 0.1 }}
              className="glass-card p-5 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm group-hover:text-brand-300 transition-colors">{wf.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{wf.description}</p>
                </div>
                <span className="category-pill text-[10px]">{wf.category}</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {wf.steps.map((step, si) => (
                  <div key={si} className="flex items-center gap-2">
                    <div className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${STEP_COLORS[si % STEP_COLORS.length]} bg-opacity-20 text-xs font-medium border border-white/[0.1]`}>
                      <span className="opacity-60">{step.action} →</span> {step.toolName}
                    </div>
                    {si < wf.steps.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* User Workflows */}
      {workflows.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-neon-orange" /> Community Workflows
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflows.map((wf: any, wi: number) => (
              <motion.div
                key={wf.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: wi * 0.05 }}
                className="glass-card p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm">{wf.title}</h3>
                    {wf.description && <p className="text-xs text-muted-foreground mt-0.5">{wf.description}</p>}
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {wf.usageCount} uses
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {wf.steps?.map((step: any, si: number) => (
                    <div key={si} className="flex items-center gap-1.5">
                      <span className="text-xs px-2 py-1 rounded bg-white/[0.04] border border-white/[0.06]">
                        {step.toolName}
                      </span>
                      {si < wf.steps.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
