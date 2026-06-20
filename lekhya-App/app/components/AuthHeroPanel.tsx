"use client";

import { motion } from "framer-motion";

export function AuthHeroPanel() {
  return (
    <div className="relative hidden lg:flex flex-col overflow-hidden bg-[#1a1512] text-white">
      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/40" />

      {/* Top-right warm glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-amber-200/20 to-violet-400/10 blur-3xl" />

      {/* Concentric decorative rings */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/3">
        <div className="h-[460px] w-[460px] rounded-full border border-white/5" />
        <div className="absolute inset-10 rounded-full border border-white/5" />
        <div className="absolute inset-20 rounded-full border border-white/5" />
      </div>

      {/* Tagline */}
      <p className="relative z-10 mx-10 mt-10 text-sm text-white/70">
        AI-powered expense tracking — every receipt, automatically organized.
      </p>

      {/* Headline */}
      <div className="relative z-10 mx-10 mt-16">
        <h2 className="text-6xl font-semibold leading-[1.05] tracking-tight">
          Track every
          <br />
          receipt.
        </h2>
      </div>

      {/* Mock device card at bottom */}
      <div className="relative z-10 mt-auto flex items-end justify-center pb-12">
        <div className="relative">
          {/* Animated gradient aura behind the card */}
          <motion.div
            aria-hidden
            className="absolute -inset-10 rounded-[60px] blur-3xl"
            animate={{
              background: [
                "radial-gradient(60% 60% at 30% 30%, rgba(139,92,246,0.45) 0%, rgba(251,191,36,0.15) 45%, rgba(0,0,0,0) 75%)",
                "radial-gradient(60% 60% at 70% 40%, rgba(236,72,153,0.4) 0%, rgba(139,92,246,0.2) 45%, rgba(0,0,0,0) 75%)",
                "radial-gradient(60% 60% at 50% 70%, rgba(251,191,36,0.4) 0%, rgba(236,72,153,0.2) 45%, rgba(0,0,0,0) 75%)",
                "radial-gradient(60% 60% at 30% 30%, rgba(139,92,246,0.45) 0%, rgba(251,191,36,0.15) 45%, rgba(0,0,0,0) 75%)",
              ],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Three breathing circles behind the card — continuous in/out pulse */}
          <motion.div
            aria-hidden
            className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/30 blur-3xl"
            animate={{ scale: [0.7, 1.3, 0.7], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300/25 blur-3xl"
            animate={{ scale: [1.2, 0.75, 1.2], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          />
          <motion.div
            aria-hidden
            className="absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/25 blur-3xl"
            animate={{ scale: [0.8, 1.35, 0.8], opacity: [0.55, 0.95, 0.55] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          />

          <div className="relative w-[260px] rounded-[40px] border border-white/10 bg-gradient-to-b from-[#2a2320] to-[#15100d] p-3 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]">
            {/* Notch */}
            <div className="mx-auto mb-2 h-1.5 w-16 rounded-full bg-white/10" />
            {/* Screen */}
            <div className="rounded-[30px] bg-[#0b0807] p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/40">
                This month
              </p>
              <p className="mt-1 text-3xl font-bold text-white">
                $1,248<span className="text-white/50">.30</span>
              </p>
              <div className="mt-3 flex items-end gap-1.5 h-16">
                {[30, 55, 40, 70, 85, 60, 45].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-gradient-to-t from-green-500/40 to-green-300"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between rounded-xl bg-white/5 px-2.5 py-1.5">
                  <span className="text-[10px] text-white/70">Groceries</span>
                  <span className="text-[10px] font-semibold text-white">
                    $420
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/5 px-2.5 py-1.5">
                  <span className="text-[10px] text-white/70">Dining</span>
                  <span className="text-[10px] font-semibold text-white">
                    $186
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
