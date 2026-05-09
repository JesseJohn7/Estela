"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Wish } from "@/lib/types";

interface LaunchWishProps {
  onLaunched: (wish: Wish) => void;
}

export default function LaunchWish({ onLaunched }: LaunchWishProps) {
  const [text, setText] = useState("");
  const [launching, setLaunching] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const handleLaunch = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > 200) {
      setError("Wishes must be 200 characters or less.");
      return;
    }

    setLaunching(true);
    setError("");

    const x = 0.1 + Math.random() * 0.8;
    const y = 0.1 + Math.random() * 0.8;

    const { data, error: dbErr } = await supabase
      .from("wishes")
      .insert({ text: trimmed, x, y, shine_count: 0 })
      .select()
      .single();

    if (dbErr) {
      setError("Failed to launch wish. Try again.");
      setLaunching(false);
      return;
    }

    onLaunched(data as Wish);
    setText("");
    setOpen(false);
    setLaunching(false);
  };

  return (
    <>
      {/* Floating launch button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.85), rgba(8,145,178,0.7))",
            border: "1px solid rgba(196,181,253,0.35)",
            color: "rgba(255,255,255,0.95)",
            boxShadow: "0 0 28px rgba(124,58,237,0.4), 0 4px 24px rgba(0,0,0,0.5)",
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.05em",
            backdropFilter: "blur(10px)",
          }}
        >
          <span style={{ filter: "drop-shadow(0 0 5px #c4b5fd)" }}>✦</span>
          Make a Wish
        </button>
      )}

      {/* Expanded input panel */}
      {open && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-8 px-4"
          style={{ pointerEvents: "none" }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-5 relative overflow-hidden"
            style={{
              background: "linear-gradient(160deg, rgba(15,10,50,0.97), rgba(5,5,28,0.98))",
              border: "1px solid rgba(196,181,253,0.2)",
              boxShadow: "0 0 40px rgba(124,58,237,0.3), 0 16px 60px rgba(0,0,0,0.7)",
              pointerEvents: "all",
              animation: "slideUp 0.35s cubic-bezier(.34,1.56,.64,1) both",
            }}
          >
            {/* Glow top edge */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(196,181,253,0.5), rgba(103,232,249,0.4), transparent)",
              }}
            />

            <div className="flex items-center gap-2 mb-3">
              <span style={{ color: "rgba(196,181,253,0.8)", filter: "drop-shadow(0 0 4px #c4b5fd)" }}>✦</span>
              <span
                className="text-xs tracking-widest uppercase"
                style={{ color: "rgba(196,181,253,0.5)", fontFamily: "'DM Mono', monospace" }}
              >
                Cast your wish into the stars
              </span>
              <div className="flex-1" />
              <button
                onClick={() => { setOpen(false); setError(""); setText(""); }}
                className="text-sm transition-opacity hover:opacity-70"
                style={{ color: "rgba(196,181,253,0.5)", fontFamily: "'DM Mono', monospace" }}
              >
                ✕
              </button>
            </div>

            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setError(""); }}
              placeholder="I wish for…"
              maxLength={200}
              rows={3}
              className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none placeholder:opacity-30 mb-3"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(196,181,253,0.15)",
                color: "rgba(255,255,255,0.9)",
                fontFamily: "'Lora', Georgia, serif",
                fontStyle: text ? "italic" : "normal",
                fontSize: "1rem",
                lineHeight: "1.6",
                caretColor: "#c4b5fd",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleLaunch();
                }
              }}
              autoFocus
            />

            {error && (
              <p className="text-xs mb-2" style={{ color: "#f87171", fontFamily: "'DM Mono', monospace" }}>
                {error}
              </p>
            )}

            <div className="flex items-center justify-between">
              <span
                className="text-xs tabular-nums"
                style={{
                  color: text.length > 180 ? "#f87171" : "rgba(196,181,253,0.35)",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {text.length}/200
              </span>

              <button
                onClick={handleLaunch}
                disabled={launching || !text.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #0891b2)",
                  color: "#fff",
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: "0.05em",
                  boxShadow: "0 0 20px rgba(124,58,237,0.4)",
                  cursor: launching || !text.trim() ? "not-allowed" : "pointer",
                }}
              >
                {launching ? (
                  <>
                    <span className="inline-block" style={{ animation: "spin 0.8s linear infinite" }}>✦</span>
                    Launching…
                  </>
                ) : (
                  <>
                    <span>✦</span> Launch
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
