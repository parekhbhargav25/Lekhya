"use client";

import { useMemo, useState } from "react";

type ReceiptInput = {
  createdAt: string;
  extractedJson: { total?: number | null } | null;
};

type Range = "1W" | "1M" | "3M" | "6M" | "1Y";

type Point = { label: string; value: number; date: Date };

const RANGES: { key: Range; label: string; days: number; bucket: "day" | "week" | "month" }[] = [
  { key: "1W", label: "1W", days: 7, bucket: "day" },
  { key: "1M", label: "1M", days: 30, bucket: "day" },
  { key: "3M", label: "3M", days: 90, bucket: "week" },
  { key: "6M", label: "6M", days: 180, bucket: "week" },
  { key: "1Y", label: "1Y", days: 365, bucket: "month" },
];

function buildPoints(receipts: ReceiptInput[], range: Range): Point[] {
  const cfg = RANGES.find((r) => r.key === range)!;
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - cfg.days);
  start.setHours(0, 0, 0, 0);

  const buckets: Point[] = [];
  const cursor = new Date(start);

  while (cursor <= now) {
    buckets.push({
      date: new Date(cursor),
      label: cursor.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      value: 0,
    });
    if (cfg.bucket === "day") cursor.setDate(cursor.getDate() + 1);
    else if (cfg.bucket === "week") cursor.setDate(cursor.getDate() + 7);
    else cursor.setMonth(cursor.getMonth() + 1);
  }

  for (const r of receipts) {
    const amt = r.extractedJson?.total;
    if (typeof amt !== "number") continue;
    const d = new Date(r.createdAt);
    if (isNaN(d.getTime()) || d < start || d > now) continue;

    // Find bucket index
    let idx = -1;
    for (let i = 0; i < buckets.length; i++) {
      const bStart = buckets[i].date;
      const bEnd =
        i + 1 < buckets.length ? buckets[i + 1].date : new Date(now.getTime() + 1);
      if (d >= bStart && d < bEnd) {
        idx = i;
        break;
      }
    }
    if (idx >= 0) buckets[idx].value += amt;
  }

  return buckets;
}

function smoothPath(points: { x: number; y: number }[], tension = 0.25): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? points[i + 1];
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return path;
}

export function FinanceInsightsChart({
  receipts,
}: {
  receipts: ReceiptInput[];
}) {
  const [range, setRange] = useState<Range>("1M");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const points = useMemo(() => buildPoints(receipts, range), [receipts, range]);
  const total = points.reduce((s, p) => s + p.value, 0);
  const maxValue = Math.max(...points.map((p) => p.value), 1);

  const WIDTH = 640;
  const HEIGHT = 220;
  const PAD_L = 40;
  const PAD_R = 16;
  const PAD_T = 20;
  const PAD_B = 32;
  const innerW = WIDTH - PAD_L - PAD_R;
  const innerH = HEIGHT - PAD_T - PAD_B;

  const xyPoints = points.map((p, i) => ({
    x: PAD_L + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW),
    y: PAD_T + innerH - (p.value / maxValue) * innerH,
  }));

  const linePath = smoothPath(xyPoints);
  const areaPath =
    xyPoints.length > 0
      ? `${linePath} L ${xyPoints[xyPoints.length - 1].x} ${PAD_T + innerH} L ${xyPoints[0].x} ${PAD_T + innerH} Z`
      : "";

  // Y axis ticks
  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    (maxValue / yTicks) * i
  );

  // X axis labels (show subset to avoid overcrowding)
  const xLabelStride = Math.max(1, Math.ceil(points.length / 8));

  return (
    <div className="rounded-3xl bg-white border border-violet-100 shadow-sm px-5 py-5 sm:px-6 sm:py-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-slate-900">Spending insights</p>
        <div className="flex items-center gap-1 rounded-full bg-slate-50 p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                range === r.key
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          ${total.toFixed(2)}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {hoverIdx != null
            ? `${points[hoverIdx].label}: $${points[hoverIdx].value.toFixed(2)}`
            : "Total for period"}
        </p>
      </div>

      <div className="mt-3 w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="spendArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Y grid + tick labels */}
          {tickValues.map((v, i) => {
            const y = PAD_T + innerH - (v / maxValue) * innerH;
            return (
              <g key={i}>
                <line
                  x1={PAD_L}
                  x2={WIDTH - PAD_R}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="3 4"
                />
                <text
                  x={PAD_L - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                >
                  {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {total > 0 && (
            <path d={areaPath} fill="url(#spendArea)" stroke="none" />
          )}

          {/* Line */}
          {total > 0 && (
            <path
              d={linePath}
              fill="none"
              stroke="#5aa25a"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Hover hit-areas + dots */}
          {xyPoints.map((pt, i) => (
            <g key={i}>
              <rect
                x={pt.x - 12}
                y={PAD_T}
                width={24}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHoverIdx(i)}
              />
              {hoverIdx === i && (
                <>
                  <line
                    x1={pt.x}
                    x2={pt.x}
                    y1={PAD_T}
                    y2={PAD_T + innerH}
                    stroke="#c4b5fd"
                    strokeDasharray="3 3"
                  />
                  <circle cx={pt.x} cy={pt.y} r={5} fill="#7c3aed" stroke="white" strokeWidth="2" />
                </>
              )}
            </g>
          ))}

          {/* X labels */}
          {points.map((p, i) => {
            if (i % xLabelStride !== 0 && i !== points.length - 1) return null;
            return (
              <text
                key={i}
                x={xyPoints[i].x}
                y={HEIGHT - 10}
                textAnchor="middle"
                fontSize="10"
                fill="#94a3b8"
              >
                {p.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
