"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Wish } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// Constants — change these if you want different limits
// ─────────────────────────────────────────────────────────────
const PER_WISH_CAP = 3;  // max stars one person can give a single wish
const DAILY_CAP    = 5;  // max stars one person can give in a day total

// ─────────────────────────────────────────────────────────────
// Fingerprint — gives each browser a stable anonymous ID
// stored in localStorage so it survives page refreshes
// ─────────────────────────────────────────────────────────────
function getFingerprint(): string {
  const KEY = "wish_fingerprint";
  let fp = localStorage.getItem(KEY);
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem(KEY, fp);
  }
  return fp;
}

interface WishCardProps {
  wish: Wish;
  onClose: () => void;
}

export default function WishCard({ wish, onClose }: WishCardProps) {
  // ── display state ──────────────────────────────────────────
  const [shineCount, setShineCount] = useState(wish.shine_count);
  const [visible, setVisible]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [particles, setParticles]   = useState<{ id: number; x: number; y: number; dx: number; dy: number }[]>([]);

  // ── limit tracking ─────────────────────────────────────────
  // givenToWish = how many stars THIS user gave THIS wish (0‑3)
  // givenToday  = how many stars THIS user gave today across all wishes (0‑5)
  const [givenToWish, setGivenToWish] = useState<number | null>(null); // null = still loading
  const [givenToday,  setGivenToday]  = useState<number | null>(null);

  const fp = useRef<string>("");

  // ── entrance animation ─────────────────────────────────────
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // ── load this user's existing shine data ───────────────────
  useEffect(() => {
    fp.current = getFingerprint();

    async function loadLimits() {
      // 1. How many times has this user starred THIS specific wish?
      const { data: wishRow } = await supabase
        .from("wish_shines")
        .select("count")
        .eq("wish_id", wish.id)
        .eq("user_fingerprint", fp.current)
        .maybeSingle();

      // 2. How many total stars has this user given today?
      //    We sum up all their wish_shines rows created today
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data: todayRows } = await supabase
        .from("wish_shines")
        .select("count")
        .eq("user_fingerprint", fp.current)
        .gte("created_at", startOfDay.toISOString());

      const todayTotal = (todayRows ?? []).reduce(
        (sum, row) => sum + (row.count ?? 0),
        0
      );

      setGivenToWish(wishRow?.count ?? 0);
      setGivenToday(todayTotal);
    }

    loadLimits();
  }, [wish.id]);

  // ── derived: why is the button blocked? ───────────────────
  // null means not blocked (button enabled)
  const blockedReason =
    givenToWish === null || givenToday === null ? "loading" :
    givenToWish >= PER_WISH_CAP                 ? "wish_cap" :
    givenToday  >= DAILY_CAP                    ? "daily_cap" :
    null;

  const isDisabled = !!blockedReason || loading;

  // ── shine handler ─────────────────────────────────────────
  const handleShine = async () => {
    if (isDisabled) return;

    // snapshot for rollback
    const prevShineCount  = shineCount;
    const prevGivenToWish = givenToWish!;
    const prevGivenToday  = givenToday!;

    // ── optimistic update (instant UI feedback) ──────────────
    setShineCount(c => c + 1);
    setGivenToWish(g => g! + 1);
    setGivenToday(d => d! + 1);
    setLoading(true);

    // burst particles
    setParticles(
      Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        x: 40 + Math.random() * 20,
        y: 40 + Math.random() * 20,
        dx: (Math.random() - 0.5) * 60,
        dy: -(20 + Math.random() * 50),
      }))
    );
    setTimeout(() => setParticles([]), 900);

    // ── write to wish_shines (upsert = insert or update) ─────
    // If user already has a row for this wish, increment count.
    // If not, create a fresh row with count = 1.
    const { error: shineErr } = await supabase
      .from("wish_shines")
      .upsert(
        {
          wish_id:          wish.id,
          user_fingerprint: fp.current,
          count:            prevGivenToWish + 1,
        },
        { onConflict: "wish_id,user_fingerprint" }
      );

    if (shineErr) {
      // rollback everything if DB write failed
      setShineCount(prevShineCount);
      setGivenToWish(prevGivenToWish);
      setGivenToday(prevGivenToDay);
      setLoading(false);
      return;
    }

    // ── increment wishes.shine_count via the SQL function ─────
    const { data: newCount, error: rpcErr } = await supabase
      .rpc("increment_shine_count", { wish_id: wish.id });

    // if RPC returned the new count, sync it (handles concurrent shines)
    if (!rpcErr && newCount !== null) {
      setShineCount(newCount as number);
    }

    setLoading(false);
  };

  // ── close with exit animation ─────────────────────────────
  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  // ── time helper ───────────────────────────────────────────
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

  // ── button label ──────────────────────────────────────────
  const buttonLabel =
    blockedReason === "loading"   ? "…" :
    blockedReason === "wish_cap"  ? "Maxed out" :
    blockedReason === "daily_cap" ? "Come back tomorrow" :
    loading                       ? "Shining…" :
    "Shine";

  const remainingToday   = givenToday  === null ? null : Math.max(0, DAILY_CAP - givenToday);
  const remainingOnWish  = givenToWish === null ? null : Math.max(0, PER_WISH_CAP - givenToWish);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={handleClose}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{
          background:    visible ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Card */}
      <div
        className="relative z-10 max-w-sm w-full mx-4"
        style={{
          transform:  visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.92)",
          opacity:    visible ? 1 : 0,
          transition: "transform 0.35s cubic-bezier(.34,1.56,.64,1), opacity 0.3s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ring */}
        <div
          className="absolute -inset-px rounded-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(196,181,253,0.6), rgba(103,232,249,0.3), rgba(196,181,253,0.1))",
            filter:     "blur(1px)",
          }}
        />

        <div
          className="relative rounded-2xl p-6 overflow-hidden"
          style={{
            background: "linear-gradient(160deg, rgba(15,10,50,0.97) 0%, rgba(5,5,28,0.98) 100%)",
            border:     "1px solid rgba(196,181,253,0.2)",
          }}
        >
          {/* Header row */}
          <div className="flex items-center gap-2 mb-4">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ filter: "drop-shadow(0 0 6px #c4b5fd)", flexShrink: 0 }}>
              <path d="M8 1 L9.2 6.8 L15 8 L9.2 9.2 L8 15 L6.8 9.2 L1 8 L6.8 6.8 Z" fill="rgba(196,181,253,0.9)" />
            </svg>
            <span className="wc-eyebrow">A wish from the galaxy</span>
            <div className="flex-1" />
            <span className="wc-time">{timeAgo(wish.created_at)}</span>
          </div>

          {/* Wish text */}
          <p className="wc-text">&ldquo;{wish.text}&rdquo;</p>

          {/* Shine row */}
          <div className="flex items-center justify-between gap-3">

            {/* Left: shine button + pips */}
            <div className="flex flex-col gap-1.5">
              <button
                onClick={handleShine}
                disabled={isDisabled}
                className={`wc-shine-btn ${isDisabled ? "wc-shine-btn--off" : "wc-shine-btn--on"}`}
              >
                {/* Particle burst */}
                {particles.map((p) => (
                  <span
                    key={p.id}
                    className="wc-particle"
                    style={{
                      left: `${p.x}%`,
                      top:  `${p.y}%`,
                      "--dx": `${p.dx}px`,
                      "--dy": `${p.dy}px`,
                    } as React.CSSProperties}
                  >
                    ✦
                  </span>
                ))}

                {/* Star icon */}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="wc-star-icon">
                  <path
                    d="M8 1.5 L9.6 6.1 H14.5 L10.5 8.9 L12.1 13.5 L8 10.7 L3.9 13.5 L5.5 8.9 L1.5 6.1 H6.4 Z"
                    fill={givenToWish ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                </svg>

                {buttonLabel}
              </button>

              {/* Per-wish pip dots  ● ● ●  */}
              {blockedReason !== "loading" && (
                <div className="flex gap-1 pl-1" title={`${remainingOnWish} of ${PER_WISH_CAP} left on this wish`}>
                  {Array.from({ length: PER_WISH_CAP }).map((_, i) => (
                    <span
                      key={i}
                      className={`wc-pip ${i < (givenToWish ?? 0) ? "wc-pip--on" : ""}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right: total shine count + daily quota */}
            <div className="flex flex-col items-end gap-1.5">
              {/* Total count */}
              <div className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1.5 L9.6 6.1 H14.5 L10.5 8.9 L12.1 13.5 L8 10.7 L3.9 13.5 L5.5 8.9 L1.5 6.1 H6.4 Z"
                    fill="rgba(196,181,253,0.7)" />
                </svg>
                <span className="wc-count">{shineCount.toLocaleString()}</span>
                <span className="wc-count-label">shines</span>
              </div>

              {/* Daily quota dots (only shows when you've used some) */}
              {remainingToday !== null && remainingToday < DAILY_CAP && (
                <div
                  className="flex gap-1"
                  title={`${remainingToday} of ${DAILY_CAP} daily stars left`}
                >
                  {Array.from({ length: DAILY_CAP }).map((_, i) => (
                    <span
                      key={i}
                      className={`wc-quota-pip ${i < remainingToday ? "wc-quota-pip--on" : ""}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .wc-eyebrow {
          font-family: 'DM Mono', ui-monospace, monospace;
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(196,181,253,0.55);
        }
        .wc-time {
          font-family: 'DM Mono', ui-monospace, monospace;
          font-size: 0.68rem;
          color: rgba(196,181,253,0.35);
        }
        .wc-text {
          font-family: 'Lora', Georgia, serif;
          font-style: italic;
          font-size: 1.1rem;
          line-height: 1.65;
          color: rgba(255,255,255,0.92);
          text-shadow: 0 0 40px rgba(196,181,253,0.25);
          margin-bottom: 1.25rem;
        }

        /* ── Shine button ── */
        .wc-shine-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0.5rem 1rem;
          border-radius: 10px;
          border: 1px solid rgba(196,181,253,0.25);
          font-family: 'DM Mono', ui-monospace, monospace;
          font-size: 0.75rem;
          letter-spacing: 0.07em;
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.15s, box-shadow 0.2s, background 0.2s, color 0.2s;
        }
        .wc-shine-btn--on {
          background: linear-gradient(135deg, rgba(124,58,237,0.25), rgba(8,145,178,0.15));
          color: rgba(196,181,253,0.9);
        }
        .wc-shine-btn--on:hover {
          background: linear-gradient(135deg, rgba(124,58,237,0.4), rgba(8,145,178,0.25));
          transform: translateY(-1px);
          box-shadow: 0 0 18px rgba(124,58,237,0.35);
        }
        .wc-shine-btn--on:active {
          transform: scale(0.96);
        }
        .wc-shine-btn--off {
          background: rgba(255,255,255,0.04);
          color: rgba(196,181,253,0.3);
          cursor: default;
          opacity: 0.6;
        }
        .wc-star-icon {
          color: rgba(196,181,253,0.8);
          flex-shrink: 0;
        }

        /* ── Per-wish pips ── */
        .wc-pip {
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          border: 1px solid rgba(196,181,253,0.3);
          background: transparent;
          transition: background 0.25s, transform 0.2s;
        }
        .wc-pip--on {
          background: rgba(196,181,253,0.8);
          border-color: rgba(196,181,253,0.8);
          transform: scale(1.2);
        }

        /* ── Shine count ── */
        .wc-count {
          font-family: 'DM Mono', ui-monospace, monospace;
          font-size: 0.9rem;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          color: rgba(196,181,253,0.9);
        }
        .wc-count-label {
          font-family: 'DM Mono', ui-monospace, monospace;
          font-size: 0.68rem;
          color: rgba(196,181,253,0.35);
        }

        /* ── Daily quota pips ── */
        .wc-quota-pip {
          display: inline-block;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(196,181,253,0.12);
          transition: background 0.2s;
        }
        .wc-quota-pip--on {
          background: rgba(103,232,249,0.55);
        }

        /* ── Burst particles ── */
        .wc-particle {
          position: absolute;
          pointer-events: none;
          font-size: 10px;
          color: #c4b5fd;
          animation: wc-burst 0.85s ease-out forwards;
        }
        @keyframes wc-burst {
          0%   { transform: translate(0, 0) scale(1);   opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
}