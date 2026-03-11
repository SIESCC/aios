import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function formatFunding(amount: number): string {
  // Amount stored in USD cents
  const usd = amount / 100;
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)}B`;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(0)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(0)}K`;
  return `$${usd}`;
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const PRICING_COLORS: Record<string, string> = {
  Free: "text-green-400 bg-green-400/10 border-green-400/20",
  Freemium: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  Paid: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  Enterprise: "text-purple-400 bg-purple-400/10 border-purple-400/20",
};

export const MODEL_TYPE_COLORS: Record<string, string> = {
  LLM: "text-brand-400 bg-brand-400/10 border-brand-400/20",
  IMAGE: "text-pink-400 bg-pink-400/10 border-pink-400/20",
  AUDIO: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  CODE: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  VIDEO: "text-red-400 bg-red-400/10 border-red-400/20",
  MULTIMODAL: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  EMBEDDING: "text-teal-400 bg-teal-400/10 border-teal-400/20",
};
