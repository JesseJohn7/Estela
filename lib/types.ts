export interface Wish {
  id: string;
  text: string;
  x: number;
  y: number;
  shine_count: number;
  created_at: string;
}

export interface StarParticle {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  wish?: Wish;
  pulsePhase: number;
}
