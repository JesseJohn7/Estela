"use client";

import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Wish, StarParticle } from "@/lib/types";

interface AmbientStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  speed: number;
  alpha: number;
  width: number;
  life: number;
  maxLife: number;
}

interface ShootingStar {
  x: number;
  y: number;
  tx: number;
  ty: number;
  progress: number;
  wish: Wish;
  trail: { x: number; y: number }[];
}

interface StarCanvasProps {
  onStarClick: (wish: Wish) => void;
  newWish: Wish | null;
}

export default function StarCanvas({ onStarClick, newWish }: StarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<StarParticle[]>([]);
  const animFrameRef = useRef<number>(0);
  const wishStarsRef = useRef<StarParticle[]>([]);
  const ambientRef = useRef<AmbientStar[]>([]);
  const frameCountRef = useRef<number>(0);
  const nextSpawnRef = useRef<number>(40);
  const shootingStarsRef = useRef<ShootingStar[]>([]);

  const spawnAmbient = useCallback((w: number, h: number): AmbientStar => {
    const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.5;
    const speed = 8 + Math.random() * 18;
    const fromTop = Math.random() > 0.35;
    const x = fromTop ? Math.random() * w * 1.2 - w * 0.1 : -30;
    const y = fromTop ? -30 : Math.random() * h * 0.6;
    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      len: 70 + Math.random() * 140,
      speed,
      alpha: 0.4 + Math.random() * 0.6,
      width: 0.6 + Math.random() * 1.8,
      life: 0,
      maxLife: 50 + Math.random() * 50,
    };
  }, []);

  const initBgStars = useCallback((w: number, h: number) => {
    const stars: StarParticle[] = [];
    for (let i = 0; i < 400; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: Math.random() * 1.4 + 0.2,
        alpha: Math.random() * 0.6 + 0.15,
        twinkleSpeed: Math.random() * 0.025 + 0.004,
        twinkleOffset: Math.random() * Math.PI * 2,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
    starsRef.current = stars;
    ambientRef.current = Array.from({ length: 4 }, () => spawnAmbient(w, h));
  }, [spawnAmbient]);

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

  useEffect(() => {
    if (!newWish || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const w = canvas.width;
    const h = canvas.height;
    const startX = Math.random() > 0.5 ? -40 : w + 40;
    const startY = Math.random() * h * 0.4;
    shootingStarsRef.current.push({
      x: startX, y: startY,
      tx: newWish.x * w, ty: newWish.y * h,
      progress: 0, wish: newWish, trail: [],
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
      frameCountRef.current++;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Nebula blobs
      const nebulaData = [
        { x: w * (0.2 + Math.sin(t * 0.04) * 0.03), y: h * 0.3,  r: 340, c: "rgba(88,28,180,0.09)"   },
        { x: w * 0.75, y: h * (0.6 + Math.cos(t * 0.03) * 0.04), r: 400, c: "rgba(14,116,144,0.07)"  },
        { x: w * 0.5,  y: h * 0.82,                               r: 290, c: "rgba(124,58,237,0.06)"  },
        { x: w * 0.88, y: h * 0.14,                               r: 220, c: "rgba(56,189,248,0.045)" },
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
        const a = s.alpha * (0.55 + 0.45 * tw);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      });

      // Spawn ambient shooting stars
      if (frameCountRef.current >= nextSpawnRef.current) {
        ambientRef.current.push(spawnAmbient(w, h));
        nextSpawnRef.current = frameCountRef.current + 45 + Math.floor(Math.random() * 100);
      }

      // Draw ambient shooting stars
      ambientRef.current = ambientRef.current.filter((as) => {
        as.x += as.vx;
        as.y += as.vy;
        as.life++;

        const lifeRatio = as.life / as.maxLife;
        let a = as.alpha;
        if (lifeRatio < 0.15) a *= lifeRatio / 0.15;
        else if (lifeRatio > 0.65) a *= (1 - lifeRatio) / 0.35;

        const nx = -as.vx / as.speed;
        const ny = -as.vy / as.speed;

        const grad = ctx.createLinearGradient(
          as.x, as.y,
          as.x + nx * as.len, as.y + ny * as.len
        );
        grad.addColorStop(0, `rgba(255,255,255,${a})`);
        grad.addColorStop(0.25, `rgba(220,210,255,${a * 0.7})`);
        grad.addColorStop(1, "transparent");

        ctx.beginPath();
        ctx.moveTo(as.x, as.y);
        ctx.lineTo(as.x + nx * as.len, as.y + ny * as.len);
        ctx.strokeStyle = grad;
        ctx.lineWidth = as.width;
        ctx.lineCap = "round";
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(as.x, as.y, as.width * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();

        return as.life < as.maxLife && as.x < w + 300 && as.y < h + 300 && as.x > -300;
      });

      // Wish-launch shooting stars
      shootingStarsRef.current = shootingStarsRef.current.filter((ss) => {
        ss.progress += 0.018;
        ss.x = lerp(ss.x, ss.tx, 0.04);
        ss.y = lerp(ss.y, ss.ty, 0.04);
        ss.trail.push({ x: ss.x, y: ss.y });
        if (ss.trail.length > 28) ss.trail.shift();

        for (let i = 0; i < ss.trail.length - 1; i++) {
          const alpha = (i / ss.trail.length) * 0.9;
          ctx.beginPath();
          ctx.moveTo(ss.trail[i].x, ss.trail[i].y);
          ctx.lineTo(ss.trail[i + 1].x, ss.trail[i + 1].y);
          ctx.strokeStyle = `rgba(196,181,253,${alpha})`;
          ctx.lineWidth = (i / ss.trail.length) * 3.5;
          ctx.stroke();
        }

        const hg = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, 14);
        hg.addColorStop(0, "rgba(255,255,255,0.95)");
        hg.addColorStop(0.4, "rgba(196,181,253,0.55)");
        hg.addColorStop(1, "transparent");
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 14, 0, Math.PI * 2);
        ctx.fill();

        if (ss.progress >= 1) {
          wishStarsRef.current.push({
            x: ss.tx, y: ss.ty,
            radius: 3, alpha: 1,
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
        const shine = s.wish?.shine_count ?? 0;
        const hue = (shine * 22 + 200) % 360;

        const aura = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 5);
        aura.addColorStop(0, `hsla(${hue},100%,90%,${0.12 + shine * 0.015})`);
        aura.addColorStop(1, "transparent");
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 5, 0, Math.PI * 2);
        ctx.fill();

        const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 1.8);
        sg.addColorStop(0, `hsla(${hue},80%,98%,1)`);
        sg.addColorStop(0.5, `hsla(${hue},70%,75%,0.9)`);
        sg.addColorStop(1, `hsla(${hue},60%,50%,0)`);
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.globalAlpha = 0.5 + tw * 0.3;
        ctx.strokeStyle = `hsla(${hue},100%,95%,0.8)`;
        ctx.lineWidth = 0.8;
        const sl = r * 2.8;
        ctx.beginPath();
        ctx.moveTo(s.x - sl, s.y); ctx.lineTo(s.x + sl, s.y);
        ctx.moveTo(s.x, s.y - sl); ctx.lineTo(s.x, s.y + sl);
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
  }, [initBgStars, loadWishes, spawnAmbient]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      for (const s of wishStarsRef.current) {
        if (Math.hypot(s.x - mx, s.y - my) < 18 && s.wish) {
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
      style={{ background: "radial-gradient(ellipse at 40% 20%, #0f0a35 0%, #060412 55%, #000008 100%)" }}
    />
  );
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}