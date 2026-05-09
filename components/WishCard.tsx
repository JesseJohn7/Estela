"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Wish } from "@/lib/types";

interface WishCardProps {
  wish: Wish;
  onClose: () => void;
}

export default function WishCard({ wish, onClose }: WishCardProps) {
  const [shineCount, setShineCount] = useState(wish.shine_count);
  const [shining, setShining] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const handleShine = async () => {
    if (shining) return;
    setShining(true);

    // burst particles
    const newParticles = Array.from({ length: 10 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 100,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 900);

    const newCount = shineCount + 1;
    setShineCount(newCount);

    await supabase
      .from("wishes")
      .update({ shine_count: newCount })
      .eq("id", wish.id);

    setTimeout(() => setShining(false), 1000);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return "just now";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{
          background: visible ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Card */}
      <div
        className="relative z-10 max-w-sm w-full mx-4"
        style={{
          transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.92)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.35s cubic-bezier(.34,1.56,.64,1), opacity 0.3s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ring */}
        <div
          className="absolute -inset-px rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(196,181,253,0.6), rgba(103,232,249,0.3), rgba(196,181,253,0.1))",
            filter: "blur(1px)",
          }}
        />

        <div
          className="relative rounded-2xl p-6 overflow-hidden"
          style={{
            background:
              "linear-gradient(160deg, rgba(15,10,50,0.97) 0%, rgba(5,5,28,0.98) 100%)",
            border: "1px solid rgba(196,181,253,0.2)",
          }}
        >
          {/* Star decoration top */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative">
              <span className="text-2xl" style={{ filter: "drop-shadow(0 0 8px #c4b5fd)" }}>
                ✦
              </span>
            </div>
            <span
              className="text-xs font-medium tracking-widest uppercase"
              style={{ color: "rgba(196,181,253,0.6)", fontFamily: "'DM Mono', monospace" }}
            >
              A wish from the galaxy
            </span>
            <div className="flex-1" />
            <span
              className="text-xs"
              style={{ color: "rgba(196,181,253,0.4)", fontFamily: "'DM Mono', monospace" }}
            >
              {timeAgo(wish.created_at)}
            </span>
          </div>

          {/* Wish text */}
          <p
            className="text-lg leading-relaxed mb-6"
            style={{
              color: "rgba(255,255,255,0.92)",
              fontFamily: "'Lora', Georgia, serif",
              fontStyle: "italic",
              textShadow: "0 0 40px rgba(196,181,253,0.3)",
            }}
          >
            &ldquo;{wish.text}&rdquo;
          </p>

          {/* Shine button */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleShine}
              disabled={shining}
              className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 overflow-hidden"
              style={{
                background: shining
                  ? "linear-gradient(135deg, #7c3aed, #0891b2)"
                  : "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(8,145,178,0.2))",
                border: "1px solid rgba(196,181,253,0.3)",
                color: shining ? "#fff" : "rgba(196,181,253,0.9)",
                transform: shining ? "scale(0.96)" : "scale(1)",
                fontFamily: "'DM Mono', monospace",
                letterSpacing: "0.05em",
              }}
            >
              {/* Particle burst */}
              {particles.map((p) => (
                <span
                  key={p.id}
                  className="absolute pointer-events-none text-xs"
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    animation: "burst 0.8s ease-out forwards",
                    color: "#c4b5fd",
                  }}
                >
                  ✦
                </span>
              ))}
              <span
                style={{
                  display: "inline-block",
                  transform: shining ? "rotate(20deg) scale(1.3)" : "rotate(0) scale(1)",
                  transition: "transform 0.3s ease",
                  filter: shining ? "drop-shadow(0 0 6px #c4b5fd)" : "none",
                }}
              >
                ✦
              </span>
              Shine
            </button>

            <div className="flex items-center gap-1.5">
              <span style={{ color: "rgba(196,181,253,0.8)", fontSize: "1rem" }}>✦</span>
              <span
                className="tabular-nums font-semibold text-sm"
                style={{ color: "rgba(196,181,253,0.9)", fontFamily: "'DM Mono', monospace" }}
              >
                {shineCount.toLocaleString()}
              </span>
              <span
                className="text-xs"
                style={{ color: "rgba(196,181,253,0.4)", fontFamily: "'DM Mono', monospace" }}
              >
                shines
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes burst {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(${Math.random() > 0.5 ? "" : "-"}${20 + Math.random() * 30}px, -${20 + Math.random() * 40}px) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
