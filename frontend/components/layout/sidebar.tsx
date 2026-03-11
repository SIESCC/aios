"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Zap, Brain, BookOpen, Github, Building2,
  MessageSquare, TrendingUp, ChevronLeft, Activity,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tools", label: "AI Tools", icon: Zap },
  { href: "/models", label: "Models", icon: Brain },
  { href: "/research", label: "Research", icon: BookOpen },
  { href: "/repos", label: "GitHub", icon: Github },
  { href: "/startups", label: "Startups", icon: Building2 },
  { href: "/prompts", label: "Prompts", icon: MessageSquare },
  { href: "/trends", label: "Trends", icon: TrendingUp },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative flex flex-col h-screen border-r border-white/[0.05] bg-black/20 backdrop-blur-xl flex-shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/[0.05]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center flex-shrink-0 glow-blue">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col"
            >
              <span className="font-bold text-sm gradient-text-brand">AIOS</span>
              <span className="text-[10px] text-muted-foreground font-mono">AI Ecosystem OS</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group cursor-pointer",
                  isActive
                    ? "bg-brand-600/20 text-brand-300 border border-brand-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                )}
              >
                <item.icon
                  className={cn(
                    "w-4 h-4 flex-shrink-0 transition-colors",
                    isActive ? "text-brand-400" : "group-hover:text-foreground"
                  )}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && !collapsed && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Admin & Settings */}
      <div className="px-2 py-3 border-t border-white/[0.05] space-y-1">
        <Link href="/admin">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all">
            <Activity className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Admin</span>}
          </div>
        </Link>
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-muted border border-white/[0.08] flex items-center justify-center hover:bg-secondary transition-colors z-10"
      >
        <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
          <ChevronLeft className="w-3 h-3 text-muted-foreground" />
        </motion.div>
      </button>
    </motion.aside>
  );
}
