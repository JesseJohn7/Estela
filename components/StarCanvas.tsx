"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Wish, StarParticle } from "@/lib/types";

interface StarCanvasProps {
  onStarClick: (wish: Wish) => void;
  newWish: Wish | null;
}

export default function StarCanvas({ onStarClick, newWish }: StarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<StarParticle[]>([]);
  const animFrameRef = useRef<number>(0);
  const wishStarsRef = useRef<StarParticle[]>([]);
  const shootingStarsRef = useRef<
    {
      x: number;
      y: number;
      tx: number;
      ty: number;
      progress: number;
      wish: Wish;
      trail: { x: number; y: number }[];
    }[]
  >([]);

  // Generate background stars
  const initBgStars = useCallback((w: number, h: number) => {
    const stars: StarParticle[] = [];
    for (let i = 0; i < 280; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: Math.random() * 1.2 + 0.3,
        alpha: Math.random() * 0.5 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
    starsRef.current = stars;
  }, []);

  // Load wishes from Supabase
  const loadWishes = useCallback(async (w: number, h: number) => {
    const { data } = await supabase
      .from("wishes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(120);

    if (data) {
      wishStarsRef.current = data.map((wish: Wish) => ({
        x: wish.x * w,
        y: wish.y * h,
        radius: Math.min(2.5 + wish.shine_count * 0.18, 6),
        alpha: 1,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        twinkleOffset: Math.random() * Math.PI * 2,
        wish,
        pulsePhase: Math.random() * Math.PI * 2,
      }));
    }
  }, []);

  // Launch shooting star animation for new wish
  useEffect(() => {
    if (!newWish || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const w = canvas.width;
    const h = canvas.height;

    const startX = Math.random() > 0.5 ? -40 : w + 40;
    const startY = Math.random() * h * 0.4;

    shootingStarsRef.current.push({
      x: startX,
      y: startY,
      tx: newWish.x * w,
      ty: newWish.y * h,
      progress: 0,
      wish: newWish,
      trail: [],
    });
  }, [newWish]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initBgStars(canvas.width, canvas.height);
      loadWishes(canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);

    let t = 0;

    const draw = () => {
      t += 0.016;
      const w = canvas.width;
      const h = canvas.height;

      // Deep space background
      ctx.clearRect(0, 0, w, h);

      // Nebula glow blobs
      const nebulaData = [
        { x: w * 0.2, y: h * 0.3, r: 300, c: "rgba(88,28,180,0.07)" },
        { x: w * 0.75, y: h * 0.6, r: 350, c: "rgba(14,116,144,0.06)" },
        { x: w * 0.5, y: h * 0.8, r: 250, c: "rgba(124,58,237,0.05)" },
      ];
      nebulaData.forEach(({ x, y, r, c }) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, c);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      });

      // Background stars
      starsRef.current.forEach((s) => {
        const tw = Math.sin(t * s.twinkleSpeed * 60 + s.twinkleOffset);
        const a = s.alpha * (0.6 + 0.4 * tw);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      });

      // Shooting stars (new wish launches)
      shootingStarsRef.current = shootingStarsRef.current.filter((ss) => {
        ss.progress += 0.018;
        const ease =
          ss.progress < 0.5
            ? 2 * ss.progress * ss.progress
            : -1 + (4 - 2 * ss.progress) * ss.progress;
        ss.x = lerp(ss.x, ss.tx, 0.04);
        ss.y = lerp(ss.y, ss.ty, 0.04);
        ss.trail.push({ x: ss.x, y: ss.y });
        if (ss.trail.length > 22) ss.trail.shift();

        // Draw trail
        for (let i = 0; i < ss.trail.length - 1; i++) {
          const alpha = (i / ss.trail.length) * 0.8;
          ctx.beginPath();
          ctx.moveTo(ss.trail[i].x, ss.trail[i].y);
          ctx.lineTo(ss.trail[i + 1].x, ss.trail[i + 1].y);
          ctx.strokeStyle = `rgba(196,181,253,${alpha})`;
          ctx.lineWidth = (i / ss.trail.length) * 3;
          ctx.stroke();
        }

        // Head glow
        const hg = ctx.createRadialGradient(
          ss.x,
          ss.y,
          0,
          ss.x,
          ss.y,
          12
        );
        hg.addColorStop(0, "rgba(255,255,255,0.9)");
        hg.addColorStop(0.4, "rgba(196,181,253,0.5)");
        hg.addColorStop(1, "transparent");
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 12, 0, Math.PI * 2);
        ctx.fill();

        if (ss.progress >= 1) {
          // Plant the wish star
          wishStarsRef.current.push({
            x: ss.tx,
            y: ss.ty,
            radius: 3,
            alpha: 1,
            twinkleSpeed: Math.random() * 0.03 + 0.01,
            twinkleOffset: Math.random() * Math.PI * 2,
            wish: ss.wish,
            pulsePhase: 0,
          });
          return false;
        }
        return true;
      });

      // Wish stars
      wishStarsRef.current.forEach((s) => {
        const tw = Math.sin(t * s.twinkleSpeed * 60 + s.twinkleOffset);
        const pulse = Math.sin(t * 1.2 + s.pulsePhase);
        const r = s.radius * (1 + pulse * 0.25);

        // Outer aura
        const aura = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 5);
        const shine = s.wish?.shine_count ?? 0;
        const hue = (shine * 22 + 200) % 360;
        aura.addColorStop(0, `hsla(${hue},100%,90%,${0.12 + shine * 0.015})`);
        aura.addColorStop(1, "transparent");
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 5, 0, Math.PI * 2);
        ctx.fill();

        // Star body
        const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 1.8);
        sg.addColorStop(0, `hsla(${hue},80%,98%,1)`);
        sg.addColorStop(0.5, `hsla(${hue},70%,75%,0.9)`);
        sg.addColorStop(1, `hsla(${hue},60%,50%,0)`);
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Sparkle cross
        ctx.save();
        ctx.globalAlpha = 0.5 + tw * 0.3;
        ctx.strokeStyle = `hsla(${hue},100%,95%,0.8)`;
        ctx.lineWidth = 0.8;
        const sl = r * 2.8;
        ctx.beginPath();
        ctx.moveTo(s.x - sl, s.y);
        ctx.lineTo(s.x + sl, s.y);
        ctx.moveTo(s.x, s.y - sl);
        ctx.lineTo(s.x, s.y + sl);
        ctx.stroke();
        ctx.restore();
      });

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [initBgStars, loadWishes]);

  // Click detection
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      for (const s of wishStarsRef.current) {
        const dist = Math.hypot(s.x - mx, s.y - my);
        if (dist < 18 && s.wish) {
          onStarClick(s.wish);
          return;
        }
      }
    },
    [onStarClick]
  );

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className="fixed inset-0 cursor-crosshair"
      style={{ background: "radial-gradient(ellipse at 50% 30%, #0d0a2e 0%, #050510 60%, #000005 100%)" }}
    />
  );
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
