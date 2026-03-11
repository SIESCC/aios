"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, User, Command, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

export function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { data: results } = useQuery({
    queryKey: ["search", query],
    queryFn: () => apiFetch(`/search?q=${encodeURIComponent(query)}&limit=5`),
    enabled: query.length >= 2,
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <header className="h-16 border-b border-white/[0.05] flex items-center justify-between px-6 bg-black/10 backdrop-blur-xl z-10 flex-shrink-0">
      {/* Search Bar */}
      <div className="flex-1 max-w-lg">
        <button
          onClick={() => { setSearchOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-muted-foreground hover:border-brand-500/30 hover:bg-white/[0.06] transition-all text-sm"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left">Search tools, models, papers...</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground/50 font-mono">
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]">⌘</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]">K</kbd>
          </div>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 ml-4">
        <button className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-white/10 transition-all">
          <Bell className="w-4 h-4" />
        </button>
        <Link href="/auth/login">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600/20 border border-brand-500/20 text-brand-300 hover:bg-brand-600/30 text-sm font-medium transition-all">
            <User className="w-4 h-4" />
            Sign In
          </button>
        </Link>
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 glass-card overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search AI ecosystem..."
                  className="flex-1 bg-transparent text-foreground placeholder-muted-foreground text-sm outline-none"
                />
                {query && (
                  <button onClick={() => setQuery("")}>
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              {/* Results */}
              {results?.results && (
                <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
                  {results.results.tools?.map((tool: any) => (
                    <Link key={tool.id} href={`/tools/${tool.slug}`} onClick={() => setSearchOpen(false)}>
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer">
                        <div className="w-6 h-6 rounded bg-brand-600/20 flex items-center justify-center text-xs">🔧</div>
                        <div>
                          <p className="text-sm font-medium">{tool.name}</p>
                          <p className="text-xs text-muted-foreground">{tool.category}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {results.results.models?.map((model: any) => (
                    <Link key={model.id} href={`/models/${model.slug}`} onClick={() => setSearchOpen(false)}>
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer">
                        <div className="w-6 h-6 rounded bg-purple-600/20 flex items-center justify-center text-xs">🧠</div>
                        <div>
                          <p className="text-sm font-medium">{model.name}</p>
                          <p className="text-xs text-muted-foreground">{model.organization}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {!results.results.tools?.length && !results.results.models?.length && (
                    <div className="py-8 text-center text-muted-foreground text-sm">No results found</div>
                  )}
                </div>
              )}

              {!query && (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Type to search across AI tools, models, papers, repos...
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
