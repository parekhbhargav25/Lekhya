"use client";

import { useMemo, useState } from "react";

type ReceiptInput = {
  createdAt: string;
  extractedJson: { total?: number | null; category?: string | null } | null;
  categoryOverride?: string | null;
};

type Range = "this-month" | "last-month" | "all-time";

const PALETTE = [
  "#7c3aed", // violet
  "#f97316", // orange
  "#eab308", // yellow
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#ec4899", // pink
  "#06b6d4", // cyan
];

function getCategory(r: ReceiptInput): string {
  if (r.categoryOverride) return r.categoryOverride;
  return r.extractedJson?.category?.trim() || "Uncategorized";
}

function inRange(createdAt: string, range: Range): boolean {
  if (range === "all-time") return true;
  const d = new Date(createdAt);
  const now = new Date();
  if (range === "this-month") {
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }
  const lm = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const ly = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  return d.getMonth() === lm && d.getFullYear() === ly;
}

export function ExpenseOverviewDonut({
  receipts,
}: {
  receipts: ReceiptInput[];
}) {
  const [range, setRange] = useState<Range>("this-month");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const slices = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of receipts) {
      const amount = r.extractedJson?.total;
      if (typeof amount !== "number") continue;
      if (!inRange(r.createdAt, range)) continue;
      const cat = getCategory(r);
      map[cat] = (map[cat] ?? 0) + amount;
    }
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    // Collapse into top 7 + "Other"
    if (entries.length > 8) {
      const top = entries.slice(0, 7);
      const rest = entries.slice(7).reduce((s, [, v]) => s + v, 0);
      top.push(["Other", rest]);
      return top;
    }
    return entries;
  }, [receipts, range]);

  const total = slices.reduce((s, [, v]) => s + v, 0);

  const SIZE = 220;
  const STROKE = 22;
  const R = (SIZE - STROKE) / 2;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const CIRC = 2 * Math.PI * R;
  const GAP = slices.length > 1 ? 6 : 0;

  let offset = 0;
  const segments = slices.map(([cat, value], i) => {
    const fraction = total > 0 ? value / total : 0;
    const length = fraction * CIRC;
    const visibleLength = Math.max(length - GAP, fraction > 0 ? 1 : 0);
    const seg = {
      cat,
      value,
      fraction,
      color: PALETTE[i % PALETTE.length],
      dashArray: `${visibleLength} ${CIRC - visibleLength}`,
      dashOffset: -offset,
    };
    offset += length;
    return seg;
  });

  const hovered = hoverIdx != null ? segments[hoverIdx] : null;

  return (
    <div className="rounded-3xl bg-white border border-violet-100 shadow-sm px-5 py-5 sm:px-6 sm:py-6 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-slate-900">Expense overview</p>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as Range)}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 focus:outline-none"
        >
          <option value="this-month">This month</option>
          <option value="last-month">Last month</option>
          <option value="all-time">All time</option>
        </select>
      </div>

      {total === 0 ? (
        <div className="flex-1 flex items-center justify-center py-10">
          <p className="text-xs text-slate-500">No expenses in this period yet.</p>
        </div>
      ) : (
        <>
          <div className="relative mx-auto my-3" style={{ width: SIZE, height: SIZE }}>
            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              <g transform={`rotate(-90 ${CX} ${CY})`}>
                {segments.map((s, i) => (
                  <circle
                    key={s.cat}
                    cx={CX}
                    cy={CY}
                    r={R}
                    fill="transparent"
                    stroke={s.color}
                    strokeWidth={STROKE}
                    strokeDasharray={s.dashArray}
                    strokeDashoffset={s.dashOffset}
                    strokeLinecap="round"
                    onMouseEnter={() => setHoverIdx(i)}
                    onMouseLeave={() => setHoverIdx(null)}
                    style={{
                      cursor: "pointer",
                      transition: "opacity 150ms",
                      opacity:
                        hoverIdx == null || hoverIdx === i ? 1 : 0.35,
                    }}
                  />
                ))}
              </g>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                ${(hovered ? hovered.value : total).toFixed(0)}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {hovered ? hovered.cat : "Total this period"}
              </p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 justify-center">
            {segments.map((s, i) => (
              <button
                key={s.cat}
                type="button"
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 hover:text-slate-900"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.cat}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
