"use client";

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
          <div className="absolute -inset-4 rounded-[44px] bg-gradient-to-br from-violet-500/20 via-amber-300/10 to-transparent blur-xl" />
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
                    className="flex-1 rounded-sm bg-gradient-to-t from-violet-500/40 to-violet-300"
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
