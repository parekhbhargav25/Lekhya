"use client";

import { useMemo, useState } from "react";

type ReceiptInput = {
  createdAt: string;
  extractedJson: { total?: number | null } | null;
};

type Range = "this-month" | "last-month" | "all-time";

type Bucket = {
  weekStart: Date;
  total: number;
  label: string;
};

function startOfWeek(d: Date): Date {
  const result = new Date(d);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function buildWeeklyBuckets(receipts: ReceiptInput[], range: Range): Bucket[] {
  const now = new Date();
  let windowStart: Date;
  let windowEnd: Date;

  if (range === "this-month") {
    windowStart = new Date(now.getFullYear(), now.getMonth(), 1);
    windowEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
  } else if (range === "last-month") {
    windowStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    windowEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999
    );
  } else {
    windowEnd = new Date(now);
    windowEnd.setHours(23, 59, 59, 999);
    windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() - 7 * 11);
    windowStart.setHours(0, 0, 0, 0);
  }

  const buckets: Bucket[] = [];
  const cursor = startOfWeek(windowStart);
  while (cursor <= windowEnd) {
    buckets.push({
      weekStart: new Date(cursor),
      total: 0,
      label: cursor.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    });
    cursor.setDate(cursor.getDate() + 7);
  }

  for (const r of receipts) {
    const amount = r.extractedJson?.total;
    if (typeof amount !== "number") continue;
    const d = new Date(r.createdAt);
    if (isNaN(d.getTime())) continue;
    if (d < windowStart || d > windowEnd) continue;
    const wStart = startOfWeek(d).getTime();
    const bucket = buckets.find((b) => b.weekStart.getTime() === wStart);
    if (bucket) bucket.total += amount;
  }

  return buckets;
}

export function WeeklyTrendChart({
  receipts,
  range,
}: {
  receipts: ReceiptInput[];
  range: Range;
}) {
  const buckets = useMemo(
    () => buildWeeklyBuckets(receipts, range),
    [receipts, range]
  );
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const hasData = buckets.some((b) => b.total > 0);
  if (!hasData) {
    return (
      <div className="rounded-2xl bg-slate-50 border border-dashed border-slate-200 h-28 flex items-center justify-center text-xs text-slate-400">
        No spending in this period yet.
      </div>
    );
  }

  const totals = buckets.map((b) => b.total);
  const max = Math.max(...totals);
  const totalSum = totals.reduce((a, b) => a + b, 0);
  const avg = totalSum / buckets.filter((b) => b.total > 0).length;
  const peakIdx = totals.indexOf(max);
  const active = hoverIdx ?? peakIdx;
  const activeBucket = buckets[active];

  const rangeLabel =
    range === "this-month"
      ? "This month"
      : range === "last-month"
      ? "Last month"
      : "Last 12 weeks";

  return (
    <div className="rounded-2xl bg-gradient-to-b from-violet-50/40 to-white border border-violet-100 px-5 py-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Weekly trend
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{rangeLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900">
            ${activeBucket.total.toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-400">
            Week of {activeBucket.label}
          </p>
        </div>
      </div>

      <div className="relative h-28">
        {/* Average line */}
        {avg > 0 && (
          <div
            className="absolute left-0 right-0 border-t border-dashed border-violet-200"
            style={{ bottom: `${(avg / max) * 100}%` }}
            aria-hidden
          >
            <span className="absolute -top-3.5 right-0 text-[9px] font-medium text-violet-400">
              avg ${avg.toFixed(0)}
            </span>
          </div>
        )}
        <div className="flex items-end gap-1.5 h-full">
          {buckets.map((b, i) => {
            const pct = max > 0 ? (b.total / max) * 100 : 0;
            const h = b.total > 0 ? Math.max(pct, 6) : 3;
            const isActive = i === active;
            return (
              <button
                key={b.weekStart.toISOString()}
                type="button"
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                onFocus={() => setHoverIdx(i)}
                onBlur={() => setHoverIdx(null)}
                aria-label={`Week of ${b.label}: $${b.total.toFixed(2)}`}
                className="flex-1 flex flex-col items-center justify-end min-w-0 h-full cursor-default focus:outline-none group"
              >
                <div
                  className={`w-full rounded-t-md transition-all ${
                    b.total === 0
                      ? "bg-slate-200"
                      : isActive
                      ? "bg-gradient-to-t from-violet-600 to-violet-400 shadow-[0_0_0_2px_rgba(139,92,246,0.2)]"
                      : "bg-gradient-to-t from-violet-400 to-violet-300 group-hover:from-violet-500 group-hover:to-violet-400"
                  }`}
                  style={{ height: `${h}%` }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-1.5 mt-2">
        {buckets.map((b, i) => (
          <div
            key={b.weekStart.toISOString()}
            className={`flex-1 text-[10px] text-center truncate ${
              i === active ? "text-violet-700 font-medium" : "text-slate-400"
            }`}
          >
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
}
