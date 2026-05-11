"use client";

import { useState } from "react";
import StarCanvas from "@/components/StarCanvas";
import WishCard from "@/components/WishCard";
import LaunchWish from "@/components/LaunchWish";
import { Wish } from "@/lib/types";

export default function Home() {
  const [selectedWish, setSelectedWish] = useState<Wish | null>(null);
  const [newWish, setNewWish] = useState<Wish | null>(null);

  const handleLaunched = (wish: Wish) => {
    setNewWish(wish);
    setTimeout(() => setNewWish(null), 100);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none">
      <StarCanvas onStarClick={setSelectedWish} newWish={newWish} />

      {/* Header */}
      <div
        className="fixed top-0 left-0 right-0 z-30 flex flex-col items-center pointer-events-none px-4"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex flex-col items-center w-full pt-6">
          <h1
            style={{
              fontFamily: "'Lora', Georgia, serif",
              color: "rgba(255,255,255,0.92)",
              textShadow: "0 0 40px rgba(196,181,253,0.5), 0 2px 12px rgba(0,0,0,0.6)",
              letterSpacing: "-0.01em",
              fontSize: "clamp(1.1rem, 5vw, 1.5rem)",
              fontWeight: 700,
              textAlign: "center",
              width: "100%",
              lineHeight: 1.2,
            }}
          >
            Estela
          </h1>
          <p
            style={{
              marginTop: "0.35rem",
              color: "rgba(196,181,253,0.45)",
              fontFamily: "'DM Mono', monospace",
              fontSize: "clamp(0.55rem, 2.2vw, 0.7rem)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              textAlign: "center",
              width: "100%",
              whiteSpace: "nowrap",
            }}
          >
            Click a star&nbsp;·&nbsp;Shine a wish&nbsp;·&nbsp;Launch your own
          </p>
        </div>
      </div>

      {selectedWish && (
        <WishCard wish={selectedWish} onClose={() => setSelectedWish(null)} />
      )}

      <LaunchWish onLaunched={handleLaunched} />

     
    </main>
  );
}