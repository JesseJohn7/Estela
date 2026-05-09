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
    // Reset so next wish can trigger again
    setTimeout(() => setNewWish(null), 100);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none">
      <StarCanvas onStarClick={setSelectedWish} newWish={newWish} />

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-30 flex flex-col items-center pt-7 pointer-events-none">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{
            fontFamily: "'Lora', Georgia, serif",
            color: "rgba(255,255,255,0.9)",
            textShadow: "0 0 40px rgba(196,181,253,0.5), 0 2px 12px rgba(0,0,0,0.6)",
            letterSpacing: "-0.01em",
          }}
        > 
          Wishing Star Galaxy
        </h1>
        <p
          className="mt-1 text-xs tracking-widest uppercase"
          style={{
            color: "rgba(196,181,253,0.45)",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          Click a star · Shine a wish · Launch your own
        </p>
      </div>

      {/* Wish card modal */}
      {selectedWish && (
        <WishCard wish={selectedWish} onClose={() => setSelectedWish(null)} />
      )}

      {/* Launch panel */}
      <LaunchWish onLaunched={handleLaunched} />
    </main>
  );
}
