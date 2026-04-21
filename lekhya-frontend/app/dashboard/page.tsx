"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatbotWidget } from "./ChatbotWidget";
import { WeeklyTrendChart } from "./WeeklyTrendChart";
import { UploadReceiptModal } from "../components/UploadReceiptModal";

type ExtractedReceipt = {
  merchant: string;
  date: string; // YYYY-MM-DD
  total: number;
  tax?: number | null;
  currency?: string | null;
  category?: string | null;
  paymentMethod?: string | null;
  lineItems?: {
    description: string;
    qty?: number | null;
    price?: number | null;
  }[];
  notes?: string | null;
};

type ReceiptRow = {
  id: string;
  userId: string;
  s3Key: string;
  s3Url: string;
  status: string;
  extractedJson: ExtractedReceipt | null;
  categoryOverride?: string | null; // <-- add this
  createdAt: string;
};

type UploadLimitInfo = {
  uploadedToday: number;
  remainingToday: number;
  limit: number;
  windowStart: string;
  windowEnd: string;
};

type RecurringExpense = {
  merchant: string;
  cadence: "weekly" | "monthly" | "yearly";
  typicalAmount: number;
  lastChargeDate: string;
  predictedNextDate: string;
  occurrenceCount: number;
  confidence: number;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const userId = session?.user?.email;
  

  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<"this-month" | "last-month" | "all-time">(
    "this-month"
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"image" | "pdf" | "other" | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadLimit, setUploadLimit] = useState<UploadLimitInfo | null>(null);
  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  
  function openPreview(url: string) {
    const lower = url.toLowerCase();
  
    if (lower.endsWith(".pdf")) {
      setPreviewType("pdf");
    } else if (/\.(png|jpe?g|gif|webp)$/.test(lower)) {
      setPreviewType("image");
    } else {
      setPreviewType("other");
    }
  
    setPreviewUrl(url);
  }
  
  function closePreview() {
    setPreviewUrl(null);
    setPreviewType(null);
  }

  function getCategory(r: ReceiptRow): string {
    if (r["categoryOverride"]) {
      // TS might complain since it's not in type; we'll fix type in a sec
      // @ts-ignore
      return r.categoryOverride || "Uncategorized";
    }
    return r.extractedJson?.category?.trim() || "Uncategorized";
  }

  async function fetchReceipts(currentUserId: string) {
    try {
      setLoading(true);
      setError(null);
  
      const res = await fetch("/api/receipts", {
        method: "GET",
        headers: { "x-user-id": currentUserId },
        credentials: "include",
      });
  
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `API returned non-JSON (status ${res.status}): ${text.slice(
            0,
            80
          )}…`
        );
      }
  
      if (!res.ok) {
        throw new Error(data.error || "Failed to load receipts");
      }
  
      const mapped: ReceiptRow[] = (data.receipts || []).map((r: any) => ({
        id: r.id,
        userId: r.userId,
        s3Key: r.s3Key,
        s3Url: r.s3Url,
        status: r.status,
        extractedJson: (r.extractedJson ?? null) as ExtractedReceipt | null,
        createdAt: r.createdAt,
        categoryOverride: r.categoryOverride ?? null,
      }));

      setReceipts(mapped);
      setUploadLimit(data.uploadLimit ?? null);
    } catch (err: any) {
      setError(err.message || "Error loading receipts");
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecurring() {
    try {
      const res = await fetch("/api/receipts/recurring", {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      setRecurring(data.recurring || []);
    } catch {
      // non-fatal: recurring section just won't render
    }
  }

  async function runExtraction(id: string) {
    try {
      setRunningId(id);
      setError(null);
  
      const res = await fetch(`/api/receipts/${id}/extract`, {
        method: "POST",
        credentials: "include", // send session cookie
      });
  
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Extraction API returned non-JSON (status ${res.status}): ${text.slice(
            0,
            80
          )}…`
        );
      }
  
      if (!res.ok) {
        throw new Error(data.error || "Extraction failed");
      }
  
      const updated = data.receipt as any;
  
      setReceipts((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: updated.status,
                extractedJson: (updated.extractedJson ??
                  null) as ExtractedReceipt | null,
              }
            : r
        )
      );
    } catch (err: any) {
      setError(err.message || "Error running extraction");
    } finally {
      setRunningId(null);
    }
  }

  // 🔹 auth guard effect – always runs
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // 🔹 fetch receipts effect – always runs (once on mount)
  useEffect(() => {
    // don’t call API until we know userId
    if (!userId) return;
    fetchReceipts(userId);
    fetchRecurring();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("upload") !== "1") return;

    setUploadOpen(true);
    router.replace("/dashboard");
  }, [router, status]);

  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  async function downloadCsv() {
    try {
      const res = await fetch("/api/receipts/export", {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expenses-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert("Failed to download expenses spreadsheet");
    }
  }

  function getInitials(): string {
    const name = session?.user?.name?.trim();
    const email = session?.user?.email?.trim();
    if (name) {
      const parts = name.split(/\s+/);
      return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
    }
    if (email) return email[0].toUpperCase();
    return "U";
  }

  // 🔹 early returns AFTER all hooks
  if (status === "loading") {
    return (
      <main className="min-h-screen bg-[#f5ecff] flex items-center justify-center">
        <p className="text-sm text-slate-500">Checking session…</p>
      </main>
    );
  }

  if (status === "unauthenticated") {
    // redirect will happen, but render nothing meanwhile
    return null;
  }

  // ----- Time range filtering -----
  function isInRange(createdAt: string) {
    if (range === "all-time") return true;

    const d = new Date(createdAt);
    const now = new Date();

    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    if (range === "this-month") {
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }

    // last-month
    let lastMonth = thisMonth - 1;
    let year = thisYear;
    if (lastMonth < 0) {
      lastMonth = 11;
      year = thisYear - 1;
    }
    return d.getMonth() === lastMonth && d.getFullYear() === year;
  }

  const receiptsInRange = receipts.filter((r) => isInRange(r.createdAt));

  // ----- Derived summary stats -----
  const parsedReceipts = receiptsInRange.filter(
    (r) => r.extractedJson && typeof r.extractedJson.total === "number"
  );
  const totalSpent = parsedReceipts.reduce(
    (sum, r) => sum + (r.extractedJson?.total || 0),
    0
  );

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const previousMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const previousMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const allParsedReceipts = receipts.filter(
    (r) => r.extractedJson && typeof r.extractedJson.total === "number"
  );

  const thisMonthSpent = allParsedReceipts.reduce((sum, r) => {
    const createdAt = new Date(r.createdAt);
    const isThisMonth =
      createdAt.getMonth() === thisMonth &&
      createdAt.getFullYear() === thisYear;

    return isThisMonth ? sum + (r.extractedJson?.total || 0) : sum;
  }, 0);

  const lastMonthSpent = allParsedReceipts.reduce((sum, r) => {
    const createdAt = new Date(r.createdAt);
    const isLastMonth =
      createdAt.getMonth() === previousMonth &&
      createdAt.getFullYear() === previousMonthYear;

    return isLastMonth ? sum + (r.extractedJson?.total || 0) : sum;
  }, 0);

  const monthOverMonthChange =
    lastMonthSpent > 0
      ? ((thisMonthSpent - lastMonthSpent) / lastMonthSpent) * 100
      : null;

  const monthOverMonthLabel =
    lastMonthSpent <= 0
      ? thisMonthSpent > 0
        ? "No receipts last month"
        : "No monthly data yet"
      : monthOverMonthChange !== null
      ? `${monthOverMonthChange >= 0 ? "+" : ""}${monthOverMonthChange.toFixed(
          1
        )}% vs last month`
      : "No monthly data yet";

  const monthOverMonthTone =
    monthOverMonthChange == null
      ? "text-slate-500"
      : monthOverMonthChange >= 0
      ? "text-emerald-600"
      : "text-red-600";

  // ----- Category breakdown (all categories) -----
  const categoryMap: Record<string, { total: number; count: number }> = {};
  for (const r of parsedReceipts) {
    const cat = getCategory(r);
    if (!categoryMap[cat]) categoryMap[cat] = { total: 0, count: 0 };
    categoryMap[cat].total += r.extractedJson?.total || 0;
    categoryMap[cat].count += 1;
  }

  const categoryEntries = Object.entries(categoryMap).sort(
    (a, b) => b[1].total - a[1].total
  );

  // ----- Recent receipts (latest first) -----
  const recentReceipts = [...parsedReceipts]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const uploadLimitTone = !uploadLimit
    ? "border-slate-200 bg-white text-slate-700"
    : uploadLimit.remainingToday === 0
    ? "border-red-200 bg-red-50 text-red-700"
    : uploadLimit.remainingToday <= 3
    ? "border-amber-200 bg-amber-50 text-amber-800"
    : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f6f0ff] to-[#fdf7ff] px-4 py-10">
      <div className="max-w-5xl mx-auto">
        {/* Top header */}
        <header className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-violet-700 mb-2 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
              >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              Back to home
            </Link>
            <h1 className="text-4xl font-semibold text-slate-900 mb-1">
              Dashboard
            </h1>
            <p className="text-sm text-slate-600">
              Your AI-powered overview of monthly spending.
            </p>
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
            {/* Time range selector */}
            <select
              value={range}
              onChange={(e) =>
                setRange(
                  e.target.value as "this-month" | "last-month" | "all-time"
                )
              }
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <option value="this-month">This month</option>
              <option value="last-month">Last month</option>
              <option value="all-time">All time</option>
            </select>

            {/* Refresh icon button */}
            <button
              onClick={() => {
                if (!userId) return;
                fetchReceipts(userId);
                fetchRecurring();
              }}
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

            {/* Primary Upload */}
            <button
              onClick={() => setUploadOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full
                        bg-gradient-to-r from-[#7b61ff] to-[#a58fff]
                        text-white text-sm font-semibold shadow-md hover:shadow-lg transition-shadow"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Upload
            </button>

            {/* Avatar menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Account menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-white text-xs font-semibold shadow-sm hover:shadow-md"
              >
                {getInitials()}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden z-20">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs text-slate-500">Signed in as</p>
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {session?.user?.email}
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-slate-500">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      downloadCsv();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-slate-500">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <path d="M7 10l5 5 5-5" />
                      <path d="M12 15V3" />
                    </svg>
                    Download CSV
                  </button>
                  <div className="border-t border-slate-100">
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <path d="M16 17l5-5-5-5" />
                        <path d="M21 12H9" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Error banner */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* MAIN CARD */}
        <section className="mb-8 rounded-3xl bg-white shadow-sm border border-violet-100 overflow-hidden">
          {/* Hero: this-month total */}
          <div className="relative bg-gradient-to-br from-[#f3ebff] via-white to-[#faf5ff] px-6 py-8 sm:px-10 sm:py-10 border-b border-violet-100">
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">
                This month
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur border border-violet-200 px-2.5 py-1 text-[10px] font-medium text-violet-700">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                AI summaries on
              </span>
            </div>
            <p className="text-6xl sm:text-7xl font-bold tracking-tight text-slate-900 leading-none">
              <AnimatedNumber value={totalSpent} prefix="$" />
            </p>
            <p className={`mt-3 text-sm font-semibold ${monthOverMonthTone}`}>
              {monthOverMonthLabel}
            </p>
          </div>

          {/* Category breakdown */}
          <div className="px-6 py-6 sm:px-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                By category
              </p>
              {categoryEntries.length > 0 && (
                <p className="text-[11px] text-slate-400">
                  {categoryEntries.length}{" "}
                  {categoryEntries.length === 1 ? "category" : "categories"}
                </p>
              )}
            </div>
            {categoryEntries.length === 0 ? (
              <p className="text-xs text-slate-500">
                No parsed receipts yet. Run AI extraction to see category
                breakdowns.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryEntries.map(([category, { total, count }]) => (
                  <div
                    key={category}
                    className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 hover:bg-slate-100/60 transition-colors"
                  >
                    <p className="text-xs font-medium text-slate-500 mb-1">
                      {category}
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      ${total.toFixed(2)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {count} {count === 1 ? "receipt" : "receipts"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly trend */}
          <div className="px-6 pb-6 sm:px-10">
            <WeeklyTrendChart receipts={receipts} range={range} />
          </div>
        </section>

        {/* Recurring expenses */}
        {recurring.length > 0 && (
          <section className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Recurring expenses
              </h2>
              <p className="text-xs text-slate-500">
                Detected from your receipts
              </p>
            </div>
            <div className="space-y-3">
              {recurring.map((r) => (
                <div
                  key={`${r.merchant}-${r.cadence}`}
                  className="flex items-center justify-between rounded-[28px] bg-white border border-violet-100 px-5 py-3 shadow-sm"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {r.merchant}
                      </span>
                      <span className="text-[10px] rounded-full bg-[#f5e9ff] text-violet-700 px-2 py-0.5 capitalize">
                        {r.cadence}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 mt-1">
                      {r.occurrenceCount} charges · next around {r.predictedNextDate}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900">
                      ~${r.typicalAmount.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {Math.round(r.confidence * 100)}% confidence
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent receipts list */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            Recent receipts
          </h2>
          {recentReceipts.length === 0 ? (
            <p className="text-xs text-slate-600">
              No parsed receipts yet. Upload from <code>/receipts</code> and
              run AI extraction.
            </p>
          ) : (
            <div className="space-y-3">
              {recentReceipts.map((r) => {
                const parsed = r.extractedJson!;
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-[28px] bg-white border border-slate-100 px-5 py-3 shadow-sm"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900">
                        {parsed.merchant || "Unknown merchant"}
                      </span>
                      <span className="text-xs text-slate-500 mt-1">
                        {getCategory(r)}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      ${parsed.total.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Full detailed list with actions & JSON */}
        {receipts.length > 0 && (
          <section className="mb-10">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                All receipts
              </h2>
              <p className="text-xs text-slate-500">
                Showing 5 at a time. Scroll for more.
              </p>
            </div>
            <div className="max-h-[920px] overflow-y-auto rounded-[32px] pr-2">
              <div className="space-y-4">
              {receipts.map((r) => {
                const parsed = r.extractedJson;
                const created = new Date(r.createdAt);

                return (
                  <div
                    key={r.id}
                    className="rounded-3xl bg-white/80 backdrop-blur border border-violet-100 px-5 py-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500">
                          ID:{" "}
                          <span className="font-mono text-[11px]">
                            {r.id}
                          </span>
                        </p>

                        <p className="text-xs text-slate-500">
                          Created:{" "}
                          {created.toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 sm:items-end">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                            r.status === "parsed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : r.status === "error"
                              ? "bg-red-50 text-red-700 border border-red-100"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {r.status}
                        </span>

                        <button
                          onClick={() => runExtraction(r.id)}
                          disabled={runningId === r.id}
                          className="px-5 py-2 rounded-full bg-[#8b5cf6] text-white text-sm font-semibold shadow-sm disabled:opacity-60"
                        >
                          {runningId === r.id
                            ? "Running…"
                            : parsed
                            ? "Re-run AI extraction"
                            : "Run AI extraction"}
                        </button>

                        {/* NEW: Delete button */}
                        <button
                          onClick={async () => {
                            if (!confirm("Delete this receipt?")) return;

                            try {
                              const res = await fetch(`/api/receipts/${r.id}`, {
                                method: "DELETE",
                                headers: userId ? { "x-user-id": userId } : {},
                                credentials: "include",
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.error || "Delete failed");

                              // remove from local state
                              setReceipts((prev) => prev.filter((rec) => rec.id !== r.id));
                            } catch (err) {
                              console.error(err);
                              alert("Failed to delete receipt");
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-1 text-xs font-semibold 
                                    rounded-full border border-red-200 
                                    text-red-700 bg-red-50 
                                    hover:bg-red-100 transition"
                        >
                          <span>🗑️</span>Delete
                        </button>
                      </div>
                    </div>

                    {parsed && (
                      <div className="mt-4 rounded-2xl bg-[#f6f0ff] border border-violet-100 px-4 py-3">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {parsed.merchant || "Unknown merchant"}
                          </p>

                          {parsed.category && (
                            <span className="text-xs rounded-full bg-white px-3 py-1 text-violet-700 border border-violet-200">
                              {parsed.category}
                            </span>
                          )}

                          {/* NEW: Show receipt button */}
                          <button
                            type="button"
                            onClick={() => openPreview(r.s3Url)}
                            className="text-xs font-semibold px-3 py-1 rounded-full 
                                      border border-violet-200 bg-white 
                                      text-violet-700 hover:bg-violet-50 
                                      transition"
                          >
                            Show receipt
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                          <div>
                            <span className="font-medium text-slate-800">
                              Date:
                            </span>{" "}
                            {parsed.date || "—"}
                          </div>
                          <div>
                            <span className="font-medium text-slate-800">
                              Total:
                            </span>{" "}
                            {parsed.total != null
                              ? `$${parsed.total.toFixed(2)}`
                              : "—"}
                          </div>
                          {parsed.tax != null && (
                            <div>
                              <span className="font-medium text-slate-800">
                                Tax:
                              </span>{" "}
                              ${parsed.tax.toFixed(2)}
                            </div>
                          )}
                          {parsed.paymentMethod && (
                            <div>
                              <span className="font-medium text-slate-800">
                                Payment:
                              </span>{" "}
                              {parsed.paymentMethod}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          </section>
        )}
      </div>
      {previewUrl && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-lg overflow-hidden">
                  {/* Close button */}
                  <button
                    type="button"
                    onClick={closePreview}
                    className="absolute top-3 right-3 text-slate-600 hover:text-slate-900 text-sm"
                  >
                    ✕
                  </button>

                  {previewType === "image" && (
                    <div className="bg-slate-50 flex items-center justify-center">
                      <img
                        src={previewUrl}
                        alt="Receipt preview"
                        className="max-h-[80vh] w-auto object-contain"
                      />
                    </div>
                  )}

                  {previewType === "pdf" && (
                    <iframe
                      src={previewUrl}
                      className="w-full h-[80vh]"
                    />
                  )}

                  {previewType === "other" && (
                    <div className="p-6 text-sm text-slate-700">
                      <p className="mb-3">
                        Preview not available for this file type.
                      </p>
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-violet-600 underline"
                      >
                        Open in new tab
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
            <ChatbotWidget />
            <UploadReceiptModal
              open={uploadOpen}
              onClose={() => setUploadOpen(false)}
              onUploaded={() => {
                if (userId) {
                  fetchReceipts(userId);
                }
              }}
              uploadsRemainingToday={uploadLimit?.remainingToday}
              dailyUploadLimit={uploadLimit?.limit}
            />
    </main>

  );
}
