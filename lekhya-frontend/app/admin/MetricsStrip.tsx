"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export type Metric = {
  label: string;
  value: number;
  series: number[];
  deltaPct: number | null;
  color: string;
  icon: ReactNode;
};

export function MetricsStrip({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {metrics.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.3, ease: "easeOut" }}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tabular-nums text-slate-900">
                    {m.value.toLocaleString()}
                  </span>
                  {m.deltaPct !== null && <DeltaBadge value={m.deltaPct} />}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{m.label}</p>
              </div>
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: `${m.color}1a`, color: m.color }}
              >
                {m.icon}
              </div>
            </div>
          </div>
          <Sparkline data={m.series} color={m.color} />
        </motion.div>
      ))}
    </div>
  );
}

function DeltaBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
        positive ? "text-green-600" : "text-red-600"
      }`}
    >
      {Math.abs(Math.round(value))}%
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`h-3 w-3 ${positive ? "" : "rotate-180"}`}
      >
        <path d="M12 5l7 9H5z" />
      </svg>
    </span>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const width = 200;
  const height = 56;
  const padTop = 6;
  const padBottom = 2;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((v, i) => ({
    x:
      data.length === 1
        ? width / 2
        : (i / (data.length - 1)) * width,
    y:
      padTop +
      (1 - (v - min) / range) * (height - padTop - padBottom),
  }));

  const linePath = smoothPath(points);
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`
      : "";

  const gradId = `spark-${color.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="block h-14 w-full"
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={areaPath}
        fill={`url(#${gradId})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
      />
    </svg>
  );
}

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  if (points.length === 2)
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;

  const tension = 0.2;
  let path = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return path;
}
