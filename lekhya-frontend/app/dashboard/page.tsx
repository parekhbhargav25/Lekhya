"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatbotWidget } from "./ChatbotWidget";
import { GmailSyncCard } from "./GmailSyncCard";
import { FinanceInsightsChart } from "./FinanceInsightsChart";
import { ExpenseOverviewDonut } from "./ExpenseOverviewDonut";
import { UploadReceiptModal } from "../components/UploadReceiptModal";
import { FixExtractionModal } from "../components/FixExtractionModal";

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
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  
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
    <main className="min-h-screen bg-gradient-to-b from-[#f6f0ff] to-[#fdf7ff] px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Top header */}
        <header className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-start sm:justify-between">
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

            {/* Admin link (only for admins) */}
            {(session?.user as { isAdmin?: boolean } | undefined)?.isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-violet-200 bg-violet-50 text-violet-700 text-sm font-semibold hover:bg-violet-100 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                </svg>
                Admin
              </Link>
            )}

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

        {/* Gmail integration */}
        <GmailSyncCard
          onSynced={() => {
            if (userId) {
              fetchReceipts(userId);
              fetchRecurring();
            }
          }}
        />

        {/* Row A: Insights chart + This month tile */}
        <section className="mb-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <FinanceInsightsChart receipts={receipts} />
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#f3ebff] via-white to-[#faf5ff] border border-violet-100 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">
                  This month
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 backdrop-blur border border-violet-200 px-2 py-0.5 text-[9px] font-medium text-violet-700">
                  <span className="h-1 w-1 rounded-full bg-violet-500" />
                  AI on
                </span>
              </div>
              <p className="text-5xl font-bold tracking-tight text-slate-900 leading-none">
                <AnimatedNumber value={totalSpent} prefix="$" />
              </p>
              <p className={`mt-2 text-xs font-semibold ${monthOverMonthTone}`}>
                {monthOverMonthLabel}
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl bg-white/70 border border-violet-100 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Receipts</p>
                <p className="mt-0.5 text-base font-semibold text-slate-900 tabular-nums">
                  {parsedReceipts.length}
                </p>
              </div>
              <div className="rounded-2xl bg-white/70 border border-violet-100 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Avg / receipt</p>
                <p className="mt-0.5 text-base font-semibold text-slate-900 tabular-nums">
                  ${parsedReceipts.length > 0 ? (totalSpent / parsedReceipts.length).toFixed(2) : "0.00"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Recurring expenses */}
        {recurring.length > 0 && (
          <section className="mb-5">
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

        {/* Row B: Donut + Recent receipts bento */}
        <section className="mb-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1">
            <ExpenseOverviewDonut receipts={receipts} />
          </div>
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Recent receipts
            </h2>
            {recentReceipts.length === 0 ? (
              <p className="text-xs text-slate-600">
                No parsed receipts yet. Upload from <code>/receipts</code> and
                run AI extraction.
              </p>
            ) : (
            (() => {
              const byAmount = [...recentReceipts].sort(
                (a, b) => (b.extractedJson?.total || 0) - (a.extractedJson?.total || 0)
              );
              const maxAmount = byAmount[0]?.extractedJson?.total || 1;

              const sizeClass = (rank: number) => {
                if (rank === 0) return "col-span-2 row-span-2";
                if (rank <= 2) return "col-span-2 row-span-1";
                return "col-span-1 row-span-1";
              };

              const amountClass = (amount: number) => {
                const ratio = amount / maxAmount;
                if (ratio >= 0.7) return "text-3xl sm:text-4xl";
                if (ratio >= 0.4) return "text-2xl";
                return "text-lg";
              };

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 auto-rows-[110px] gap-3 [grid-auto-flow:dense]">
                  {byAmount.map((r, i) => {
                    const parsed = r.extractedJson!;
                    const isHero = i === 0;
                    return (
                      <div
                        key={r.id}
                        className={`${sizeClass(i)} relative overflow-hidden rounded-3xl border p-4 shadow-sm flex flex-col justify-between ${
                          isHero
                            ? "bg-gradient-to-br from-[#7b61ff] via-[#8b5cf6] to-[#c084fc] border-violet-300 text-white"
                            : "bg-white border-slate-100 text-slate-900"
                        }`}
                      >
                        <div>
                          <p
                            className={`text-[11px] uppercase tracking-wider ${
                              isHero ? "text-white/70" : "text-slate-500"
                            }`}
                          >
                            {getCategory(r)}
                          </p>
                          <p
                            className={`mt-0.5 font-medium leading-tight line-clamp-2 ${
                              isHero ? "text-base sm:text-lg" : "text-sm"
                            }`}
                          >
                            {parsed.merchant || "Unknown merchant"}
                          </p>
                        </div>
                        <p
                          className={`${amountClass(parsed.total)} font-bold tabular-nums leading-none`}
                        >
                          ${parsed.total.toFixed(2)}
                        </p>
                        {isHero && (
                          <span className="absolute top-3 right-3 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                            Top
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()
            )}
          </div>
        </section>

        {/* All receipts — tile grid */}
        {receipts.length > 0 && (() => {
          const q = search.trim().toLowerCase();
          const filteredReceipts = q
            ? receipts.filter((r) => {
                const p = r.extractedJson;
                const merchant = (p?.merchant || "").toLowerCase();
                const category = getCategory(r).toLowerCase();
                const total = typeof p?.total === "number" ? p.total.toFixed(2) : "";
                const date = (p?.date || "").toLowerCase();
                const status = r.status.toLowerCase();
                return (
                  merchant.includes(q) ||
                  category.includes(q) ||
                  total.includes(q) ||
                  date.includes(q) ||
                  status.includes(q)
                );
              })
            : receipts;

          return (
          <section className="mb-10">
            <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900 shrink-0">
                All receipts
              </h2>
              <div className="flex items-center gap-3 sm:justify-end sm:flex-1">
                <div className="relative flex-1 sm:flex-initial sm:w-72">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search merchant, category, amount…"
                    className="w-full rounded-full border border-slate-200 bg-white pl-9 pr-8 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 whitespace-nowrap">
                  {q
                    ? `${filteredReceipts.length} of ${receipts.length}`
                    : `${receipts.length} total${receipts.length > 8 ? " · scroll" : ""}`}
                </p>
              </div>
            </div>
            {filteredReceipts.length === 0 ? (
              <div className="rounded-3xl bg-white border border-slate-100 px-6 py-10 text-center">
                <p className="text-sm text-slate-500">
                  No receipts match <span className="font-semibold text-slate-700">&ldquo;{search}&rdquo;</span>
                </p>
              </div>
            ) : (
            <div className="max-h-[640px] overflow-y-auto rounded-3xl pr-2">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredReceipts.map((r) => {
                  const parsed = r.extractedJson;
                  const created = new Date(r.createdAt);

                  return (
                    <div
                      key={r.id}
                      className="relative flex flex-col rounded-2xl bg-white border border-violet-100 p-4 shadow-sm hover:shadow-md hover:border-violet-200 transition min-h-[170px]"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            r.status === "parsed"
                              ? "bg-emerald-50 text-emerald-700"
                              : r.status === "error"
                                ? "bg-red-50 text-red-700"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {r.status}
                        </span>
                        <div className="flex items-center gap-1">
                          {parsed && (
                            <button
                              type="button"
                              onClick={() => openPreview(r.s3Url)}
                              aria-label="View receipt image"
                              title="View receipt"
                              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                          )}
                          {parsed && (
                            <button
                              type="button"
                              onClick={() => setFixingId(r.id)}
                              aria-label="Fix extraction"
                              title="Something off?"
                              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-violet-500 hover:bg-violet-50 hover:text-violet-700"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
                              </svg>
                            </button>
                          )}
                          <button
                            type="button"
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
                                setReceipts((prev) => prev.filter((rec) => rec.id !== r.id));
                              } catch (err) {
                                console.error(err);
                                alert("Failed to delete receipt");
                              }
                            }}
                            aria-label="Delete receipt"
                            title="Delete"
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                              <path d="M3 6h18" />
                              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {parsed ? (
                        <>
                          <p className="text-sm font-semibold text-slate-900 truncate" title={parsed.merchant || "Unknown merchant"}>
                            {parsed.merchant || "Unknown merchant"}
                          </p>
                          <p className="text-[11px] text-slate-500 mb-3 truncate">
                            {getCategory(r)}
                          </p>
                          <div className="mt-auto">
                            <p className="text-2xl font-bold tabular-nums text-slate-900 leading-none">
                              {typeof parsed.total === "number"
                                ? `$${parsed.total.toFixed(2)}`
                                : "—"}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              {parsed.date || created.toLocaleDateString()}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-1 flex-col items-start justify-between">
                          <p className="text-xs text-slate-500">
                            Awaiting extraction
                          </p>
                          <button
                            onClick={() => runExtraction(r.id)}
                            disabled={runningId === r.id}
                            className="mt-3 w-full rounded-full bg-[#8b5cf6] px-3 py-1.5 text-xs font-semibold text-white shadow-sm disabled:opacity-60"
                          >
                            {runningId === r.id ? "Running…" : "Run AI"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            )}
          </section>
          );
        })()}
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
            <FixExtractionModal
              open={Boolean(fixingId)}
              onClose={() => setFixingId(null)}
              receiptId={fixingId || ""}
              current={
                receipts.find((r) => r.id === fixingId)?.extractedJson || null
              }
              onSuccess={(updated) => {
                setReceipts((prev) =>
                  prev.map((r) =>
                    r.id === fixingId
                      ? {
                          ...r,
                          status: updated.status,
                          extractedJson: (updated.extractedJson ??
                            null) as ExtractedReceipt | null,
                        }
                      : r
                  )
                );
              }}
            />
    </main>

  );
}
