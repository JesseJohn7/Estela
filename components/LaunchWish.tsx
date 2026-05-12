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
      {/* Trigger button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="launch-btn"
          aria-label="Make a wish"
        >
          <span className="launch-btn__icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1 L9.2 6.8 L15 8 L9.2 9.2 L8 15 L6.8 9.2 L1 8 L6.8 6.8 Z"
                fill="currentColor"
                opacity="0.9"
              />
            </svg>
          </span>
          <span className="launch-btn__label">Make a Wish</span>
        </button>
      )}

      {/* Wish panel */}
      {open && (
        <div className="panel-backdrop" role="dialog" aria-modal="true" aria-label="Make a wish">
          <div className="panel">
            {/* Top shimmer line */}
            <div className="panel__shimmer" aria-hidden="true" />

            {/* Header */}
            <div className="panel__header">
              <p className="panel__eyebrow">Cast your wish into the stars</p>
              <button
                onClick={() => { setOpen(false); setError(""); setText(""); }}
                className="panel__close"
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Textarea */}
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setError(""); }}
              placeholder="I wish for…"
              maxLength={200}
              rows={3}
              className="panel__textarea"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleLaunch();
                }
              }}
              autoFocus
            />

            {error && (
              <p className="panel__error" role="alert">{error}</p>
            )}

            {/* Footer */}
            <div className="panel__footer">
              <span className={`panel__count ${text.length > 180 ? "panel__count--warn" : ""}`}>
                {text.length}<span>/200</span>
              </span>

              <button
                onClick={handleLaunch}
                disabled={launching || !text.trim()}
                className="submit-btn"
              >
                {launching ? (
                  <>
                    <span className="submit-btn__spinner" aria-hidden="true" />
                    Sending…
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                      <path d="M1 12L12 1M12 1H4.5M12 1V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Launch
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style suppressHydrationWarning>{`
        /* ── Trigger button ── */
        .launch-btn {
          position: fixed;
          bottom: clamp(1.25rem, 4vw, 2rem);
          left: 50%;
          transform: translateX(-50%);
          z-index: 40;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.7rem 1.5rem;
          border-radius: 100px;
          border: 1px solid rgba(196, 181, 253, 0.25);
          background: rgba(12, 8, 42, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          color: rgba(220, 210, 255, 0.9);
          font-family: 'DM Mono', ui-monospace, monospace;
          font-size: clamp(0.75rem, 2.5vw, 0.8125rem);
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          box-shadow: 0 0 0 1px rgba(124,58,237,0.1), 0 8px 32px rgba(0,0,0,0.5);
          white-space: nowrap;
        }
        .launch-btn:hover {
          transform: translateX(-50%) translateY(-2px);
          border-color: rgba(196, 181, 253, 0.45);
          box-shadow: 0 0 24px rgba(124,58,237,0.3), 0 12px 40px rgba(0,0,0,0.55);
        }
        .launch-btn:active {
          transform: translateX(-50%) translateY(0px) scale(0.97);
        }
        .launch-btn__icon {
          display: flex;
          align-items: center;
          color: rgba(196, 181, 253, 0.7);
          flex-shrink: 0;
        }
        .launch-btn__label {
          line-height: 1;
        }

        /* ── Panel backdrop ── */
        .panel-backdrop {
          position: fixed;
          inset: 0;
          z-index: 40;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: clamp(0.75rem, 3vw, 1.5rem);
          pointer-events: none;
        }

        /* ── Panel ── */
        .panel {
          position: relative;
          width: 100%;
          max-width: 520px;
          border-radius: 20px;
          padding: clamp(1rem, 4vw, 1.375rem);
          background: linear-gradient(160deg, rgba(13, 9, 46, 0.98), rgba(5, 4, 24, 0.99));
          border: 1px solid rgba(196, 181, 253, 0.15);
          box-shadow:
            0 0 0 1px rgba(103,232,249,0.05),
            0 0 40px rgba(124,58,237,0.2),
            0 24px 64px rgba(0,0,0,0.75);
          pointer-events: all;
          animation: panelUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          overflow: hidden;
        }

        .panel__shimmer {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(196,181,253,0.4) 35%, rgba(103,232,249,0.35) 65%, transparent 100%);
        }

        /* ── Panel header ── */
        .panel__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.875rem;
        }
        .panel__eyebrow {
          font-family: 'DM Mono', ui-monospace, monospace;
          font-size: clamp(0.65rem, 2vw, 0.7rem);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(196, 181, 253, 0.4);
          margin: 0;
        }
        .panel__close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid rgba(196,181,253,0.1);
          background: rgba(255,255,255,0.04);
          color: rgba(196,181,253,0.45);
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s, background 0.15s;
          flex-shrink: 0;
        }
        .panel__close:hover {
          color: rgba(196,181,253,0.8);
          border-color: rgba(196,181,253,0.25);
          background: rgba(255,255,255,0.07);
        }

        /* ── Textarea ── */
        .panel__textarea {
          width: 100%;
          resize: none;
          border-radius: 12px;
          padding: 0.8rem 1rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(196,181,253,0.12);
          color: rgba(255,255,255,0.88);
          font-family: 'Lora', Georgia, serif;
          font-style: italic;
          font-size: clamp(0.9rem, 3vw, 1rem);
          line-height: 1.65;
          caret-color: #c4b5fd;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
          margin-bottom: 0.75rem;
        }
        .panel__textarea::placeholder {
          color: rgba(196,181,253,0.25);
          font-style: italic;
        }
        .panel__textarea:focus {
          border-color: rgba(196,181,253,0.28);
        }

        /* ── Error ── */
        .panel__error {
          font-family: 'DM Mono', ui-monospace, monospace;
          font-size: 0.7rem;
          color: #f87171;
          margin: -0.25rem 0 0.6rem;
        }

        /* ── Footer ── */
        .panel__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
        }
        .panel__count {
          font-family: 'DM Mono', ui-monospace, monospace;
          font-size: 0.7rem;
          color: rgba(196,181,253,0.3);
          font-variant-numeric: tabular-nums;
          transition: color 0.2s;
          flex-shrink: 0;
        }
        .panel__count span {
          opacity: 0.5;
        }
        .panel__count--warn {
          color: #f87171;
        }

        /* ── Submit button ── */
        .submit-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.6rem 1.2rem;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #6d28d9, #0e7490);
          color: rgba(255,255,255,0.95);
          font-family: 'DM Mono', ui-monospace, monospace;
          font-size: clamp(0.72rem, 2vw, 0.78rem);
          font-weight: 500;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 0 16px rgba(109,40,217,0.4);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 0 24px rgba(109,40,217,0.55);
        }
        .submit-btn:active:not(:disabled) {
          transform: scale(0.97);
        }
        .submit-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        /* Spinner */
        .submit-btn__spinner {
          display: inline-block;
          width: 12px;
          height: 12px;
          border: 1.5px solid rgba(255,255,255,0.3);
          border-top-color: rgba(255,255,255,0.9);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        /* ── Animations ── */
        @keyframes panelUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ── Mobile tweaks ── */
        @media (max-width: 480px) {
          .panel {
            border-bottom-left-radius: 12px;
            border-bottom-right-radius: 12px;
          }
          .panel-backdrop {
            padding-bottom: env(safe-area-inset-bottom, 0.75rem);
          }
        }
      `}</style>
    </>
  );
}