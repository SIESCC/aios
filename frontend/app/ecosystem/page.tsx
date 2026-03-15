"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Network, ZoomIn, ZoomOut, Maximize2, Info } from "lucide-react";
import { api } from "@/lib/api";

const TYPE_COLORS: Record<string, string> = {
  tool: "#4f55ff",
  model: "#a855f7",
  startup: "#00ff88",
  paper: "#00f5ff",
  repo: "#ff6b35",
};

const TYPE_LABELS: Record<string, string> = {
  tool: "AI Tool",
  model: "AI Model",
  startup: "Startup",
  paper: "Paper",
  repo: "Repository",
};

interface GraphNode {
  id: string;
  name: string;
  type: string;
  group: string;
  score: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  slug?: string;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
  strength: number;
}

export default function EcosystemPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const animFrameRef = useRef<number>(0);
  const nodesRef = useRef<GraphNode[]>([]);

  const { data: graphData } = useQuery({
    queryKey: ["ecosystem-graph"],
    queryFn: api.ecosystem.graph,
  });

  // Initialize node positions when data loads
  useEffect(() => {
    if (!graphData) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const centerX = w / 2;
    const centerY = h / 2;

    const initialized: GraphNode[] = graphData.nodes.map((n: any, i: number) => {
      const angle = (i / graphData.nodes.length) * Math.PI * 2;
      const radius = 150 + Math.random() * 150;
      return {
        ...n,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      };
    });

    nodesRef.current = initialized;
    setNodes(initialized);
    setEdges(graphData.edges || []);
  }, [graphData]);

  // Physics simulation
  const simulate = useCallback(() => {
    const ns = nodesRef.current;
    if (ns.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const centerX = w / 2;
    const centerY = h / 2;

    // Apply forces
    for (let i = 0; i < ns.length; i++) {
      const n = ns[i];
      // Center gravity
      n.vx += (centerX - n.x) * 0.0005;
      n.vy += (centerY - n.y) * 0.0005;

      // Repulsion
      for (let j = i + 1; j < ns.length; j++) {
        const m = ns[j];
        const dx = n.x - m.x;
        const dy = n.y - m.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 300 / (dist * dist);
        const fx = dx / dist * force;
        const fy = dy / dist * force;
        n.vx += fx;
        n.vy += fy;
        m.vx -= fx;
        m.vy -= fy;
      }
    }

    // Edge attraction
    const nodeMap = new Map(ns.map(n => [n.id, n]));
    edges.forEach(e => {
      const s = nodeMap.get(e.source);
      const t = nodeMap.get(e.target);
      if (s && t) {
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 120) * 0.002 * e.strength;
        s.vx += dx / dist * force;
        s.vy += dy / dist * force;
        t.vx -= dx / dist * force;
        t.vy -= dy / dist * force;
      }
    });

    // Apply velocity with damping
    ns.forEach(n => {
      n.vx *= 0.85;
      n.vy *= 0.85;
      n.x += n.vx;
      n.y += n.vy;
      // Boundary
      n.x = Math.max(30, Math.min(w - 30, n.x));
      n.y = Math.max(30, Math.min(h - 30, n.y));
    });

    setNodes([...ns]);
    animFrameRef.current = requestAnimationFrame(simulate);
  }, [edges]);

  useEffect(() => {
    if (nodes.length > 0) {
      animFrameRef.current = requestAnimationFrame(simulate);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length, simulate]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // Draw edges
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    edges.forEach(e => {
      const s = nodeMap.get(e.source);
      const t = nodeMap.get(e.target);
      if (s && t) {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = `rgba(255,255,255,${0.04 + e.strength * 0.06})`;
        ctx.lineWidth = 0.5 + e.strength;
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(n => {
      const color = TYPE_COLORS[n.type] || "#666";
      const radius = 4 + (n.score || 0) * 0.06;
      const isHovered = hoveredNode?.id === n.id;

      // Glow
      if (isHovered) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius + 8, 0, Math.PI * 2);
        ctx.fillStyle = color + "30";
        ctx.fill();
      }

      // Node
      ctx.beginPath();
      ctx.arc(n.x, n.y, isHovered ? radius + 2 : radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Label
      if (isHovered || radius > 7) {
        ctx.font = `${isHovered ? 11 : 9}px Inter, sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.textAlign = "center";
        ctx.fillText(n.name.slice(0, 25), n.x, n.y - radius - 5);
      }
    });

    ctx.restore();
  }, [nodes, edges, hoveredNode, zoom, offset]);

  // Mouse interactions
  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - offset.x) / zoom;
    const my = (e.clientY - rect.top - offset.y) / zoom;

    if (isDragging) {
      setOffset({
        x: offset.x + (e.clientX - dragStart.x),
        y: offset.y + (e.clientY - dragStart.y),
      });
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    let found: GraphNode | null = null;
    for (const n of nodes) {
      const dx = n.x - mx;
      const dy = n.y - my;
      if (dx * dx + dy * dy < 200) {
        found = n;
        break;
      }
    }
    setHoveredNode(found);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Network className="w-6 h-6 text-brand-400" />
            AI Ecosystem Map
          </h1>
          <p className="text-sm text-muted-foreground">Interactive visualization of the AI ecosystem relationships</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="w-8 h-8 glass-card flex items-center justify-center hover:border-brand-400/40 transition-colors">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))} className="w-8 h-8 glass-card flex items-center justify-center hover:border-brand-400/40 transition-colors">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }} className="w-8 h-8 glass-card flex items-center justify-center hover:border-brand-400/40 transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            {TYPE_LABELS[type]}
          </div>
        ))}
      </div>

      {/* Graph Canvas */}
      <div className="glass-card relative overflow-hidden" style={{ height: "70vh" }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseMove={handleMouseMove}
          onMouseDown={(e) => { setIsDragging(true); setDragStart({ x: e.clientX, y: e.clientY }); }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => { setIsDragging(false); setHoveredNode(null); }}
        />

        {/* Hovered node info */}
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 glass-card p-4 min-w-[240px]"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TYPE_COLORS[hoveredNode.type] }} />
              <span className="text-xs uppercase font-mono text-muted-foreground">{TYPE_LABELS[hoveredNode.type]}</span>
            </div>
            <p className="font-semibold text-sm">{hoveredNode.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Group: {hoveredNode.group} · Score: {hoveredNode.score?.toFixed(0) || 0}
            </p>
          </motion.div>
        )}

        {/* Stats overlay */}
        {graphData?.stats && (
          <div className="absolute top-4 right-4 glass-card p-3 text-xs font-mono text-muted-foreground">
            <div className="flex items-center gap-1 mb-1"><Info className="w-3 h-3" /> Graph Stats</div>
            <div>{graphData.stats.nodes} nodes · {graphData.stats.edges} edges</div>
          </div>
        )}
      </div>
    </div>
  );
}
