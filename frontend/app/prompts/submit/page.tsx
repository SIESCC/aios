"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Pen, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

const CATEGORIES = ["Development", "Research", "Business", "Creative", "Marketing", "Data Science", "Education"];

export default function SubmitPromptPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    promptText: "",
    usageExample: "",
    category: "Development",
    tags: "",
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to submit");
      return response.json();
    },
    onSuccess: () => {
      setTimeout(() => router.push("/prompts"), 2000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = formData.tags.split(",").map(t => t.trim()).filter(Boolean).slice(0, 5);
    mutation.mutate({ ...formData, tags });
  };

  if (mutation.isSuccess) {
    return (
      <div className="p-6 max-w-[600px] mx-auto text-center py-20 animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 mx-auto flex items-center justify-center mb-4 border border-green-500/30">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Prompt Submitted!</h2>
        <p className="text-muted-foreground mb-6">Your prompt has been submitted for review and will appear in the library shortly.</p>
        <button onClick={() => router.push("/prompts")} className="btn-neon text-white">
          Return to Library
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-8">
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to library
      </button>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Pen className="w-6 h-6 text-brand-400" />
          Submit a Prompt
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Share your best AI prompts with the community.</p>
      </div>

      <motion.form 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onSubmit={handleSubmit}
        className="glass-card p-6 space-y-5"
      >
        {mutation.isError && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Failed to submit prompt. Please try again.
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Title <span className="text-red-500">*</span></label>
            <input 
              required minLength={5} maxLength={100}
              placeholder="e.g. Expert React Developer Persona"
              className="w-full px-4 py-2.5 bg-black/40 border border-white/[0.06] rounded-lg focus:outline-none focus:border-brand-500/50"
              value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Category <span className="text-red-500">*</span></label>
            <select 
              className="w-full px-4 py-2.5 bg-black/40 border border-white/[0.06] rounded-lg focus:outline-none focus:border-brand-500/50 appearance-none text-foreground"
              value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <input 
              placeholder="Briefly describe what this prompt does"
              className="w-full px-4 py-2.5 bg-black/40 border border-white/[0.06] rounded-lg focus:outline-none focus:border-brand-500/50"
              value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Prompt Text <span className="text-red-500">*</span></label>
            <textarea 
              required minLength={10} rows={6}
              placeholder="Paste your prompt exactly as it should be used. Use [brackets] for variables."
              className="w-full px-4 py-2.5 bg-black/40 border border-white/[0.06] rounded-lg focus:outline-none focus:border-brand-500/50 font-mono text-sm leading-relaxed"
              value={formData.promptText} onChange={e => setFormData({ ...formData, promptText: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Usage Example</label>
            <textarea 
              rows={3}
              placeholder="How should someone use this? What variables do they need to fill in?"
              className="w-full px-4 py-2.5 bg-black/40 border border-white/[0.06] rounded-lg focus:outline-none focus:border-brand-500/50 text-sm"
              value={formData.usageExample} onChange={e => setFormData({ ...formData, usageExample: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Tags (comma separated)</label>
            <input 
              placeholder="e.g. coding, react, debugging"
              className="w-full px-4 py-2.5 bg-black/40 border border-white/[0.06] rounded-lg focus:outline-none focus:border-brand-500/50"
              value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            type="submit" 
            disabled={mutation.isPending}
            className="btn-neon text-white disabled:opacity-50 min-w-[120px]"
          >
            {mutation.isPending ? "Submitting..." : "Submit Prompt"}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
