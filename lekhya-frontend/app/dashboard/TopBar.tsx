"use client";

import { usePathname } from "next/navigation";
import { useDashboard, type Range } from "./DashboardContext";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Overview",
    subtitle: "Your AI-powered overview of monthly spending.",
  },
  "/dashboard/receipts": {
    title: "Receipts",
    subtitle: "Browse, search, and manage every receipt.",
  },
  "/dashboard/recurring": {
    title: "Recurring",
    subtitle: "Subscriptions and repeat charges detected from your data.",
  },
  "/dashboard/gmail": {
    title: "Gmail Sync",
    subtitle: "Pull receipts straight from your inbox.",
  },
};

export function TopBar() {
  const pathname = usePathname() ?? "/dashboard";
  const { range, setRange, refresh, loading, uploadLimit } = useDashboard();

  const meta = TITLES[pathname] ?? TITLES["/dashboard"];

  const showRange = pathname === "/dashboard" || pathname === "/dashboard/receipts";

  const uploadLimitTone = !uploadLimit
    ? "border-slate-200 bg-white text-slate-700"
    : uploadLimit.remainingToday === 0
    ? "border-red-200 bg-red-50 text-red-700"
    : uploadLimit.remainingToday <= 3
    ? "border-amber-200 bg-amber-50 text-amber-800"
    : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return (
    <header className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 mb-1">{meta.title}</h1>
        <p className="text-sm text-slate-600">{meta.subtitle}</p>
        {uploadLimit && (
          <div
            className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm ${uploadLimitTone}`}
          >
            <span className="font-semibold">
              {uploadLimit.remainingToday} uploads left today
            </span>
            <span className="opacity-60">·</span>
            <span className="opacity-70">
              {uploadLimit.uploadedToday}/{uploadLimit.limit} used
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        {showRange && (
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as Range)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <option value="this-month">This month</option>
            <option value="last-month">Last month</option>
            <option value="all-time">All time</option>
          </select>
        )}

        <button
          onClick={refresh}
          disabled={loading}
          aria-label="Refresh"
          title="Refresh"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-60"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          >
            <path d="M21 12a9 9 0 1 1-3-6.7" />
            <path d="M21 4v5h-5" />
          </svg>
        </button>
      </div>
    </header>
  );
}
