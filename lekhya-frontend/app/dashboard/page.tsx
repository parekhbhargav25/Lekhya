"use client";

import { useEffect, useState } from "react";
import { AnimatedNumber } from "../ui/AnimatedNumber";

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
  createdAt: string;
};

export default function DashboardPage() {
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchReceipts() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/receipts");
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
      }));

      setReceipts(mapped);
    } catch (err: any) {
      setError(err.message || "Error loading receipts");
    } finally {
      setLoading(false);
    }
  }

  async function runExtraction(id: string) {
    try {
      setRunningId(id);
      setError(null);

      const res = await fetch(`/api/receipts/${id}/extract`, {
        method: "POST",
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

  useEffect(() => {
    fetchReceipts();
  }, []);

  // ----- Derived summary stats -----
  const parsedReceipts = receipts.filter(
    (r) => r.extractedJson && typeof r.extractedJson.total === "number"
  );
  const totalSpent = parsedReceipts.reduce(
    (sum, r) => sum + (r.extractedJson?.total || 0),
    0
  );

  // ----- Category breakdown (all categories) -----
  const categoryMap: Record<string, { total: number; count: number }> = {};
  for (const r of parsedReceipts) {
    const cat = (r.extractedJson?.category || "Uncategorized").trim();
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f6f0ff] to-[#fdf7ff] px-4 py-10">
      <div className="max-w-5xl mx-auto">
        {/* Top header */}
        <header className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-slate-900 mb-1">
              Dashboard
            </h1>
            <p className="text-sm text-slate-600">
              Your AI-powered overview of monthly spending.
            </p>
          </div>
          <button
            onClick={fetchReceipts}
            disabled={loading}
            className="self-start px-5 py-2 rounded-full bg-white text-slate-900 text-sm font-semibold shadow-sm border border-slate-200 disabled:opacity-60"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </header>

        {/* Error banner */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* MAIN CARD */}
        <section className="mb-8 rounded-[32px] bg-white shadow-sm border border-violet-100 px-5 py-6 sm:px-7 sm:py-7">
          {/* Row 1: This month + AI pill */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">
                This month
              </p>
              <p className="text-4xl sm:text-5xl font-semibold text-slate-900">
                <AnimatedNumber value={totalSpent} prefix="$" />
              </p>
              <p className="mt-1 text-xs text-emerald-600 font-medium">
                +18.2% vs last month
                <span className="text-[11px] text-slate-400 font-normal ml-1">
                  (placeholder)
                </span>
              </p>
            </div>

            <span className="inline-flex items-center rounded-full bg-[#f5e9ff] px-4 py-1.5 text-xs font-semibold text-violet-700 shadow-sm">
              AI summaries enabled
            </span>
          </div>

          {/* Row 2: dynamic category grid (Groceries, Dining, Fuel, etc.) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            {categoryEntries.length === 0 ? (
              <div className="col-span-full text-xs text-slate-500">
                No parsed receipts yet. Run AI extraction to see category
                breakdowns.
              </div>
            ) : (
              categoryEntries.map(([category, { total, count }], index) => {
                const bgClass =
                  index % 3 === 0
                    ? "bg-[#f3f7ff] border-[#dbe6ff]"
                    : index % 3 === 1
                    ? "bg-[#f9f5ff] border-[#e4d7ff]"
                    : "bg-[#f5fbff] border-[#d7efff]";

                return (
                  <div
                    key={category}
                    className={`rounded-[28px] px-4 py-4 border text-left ${bgClass}`}
                  >
                    <p className="text-xs font-medium text-slate-500 mb-1">
                      {category}
                    </p>
                    <p className="text-xl font-semibold text-slate-900">
                      ${total.toFixed(2)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {count} {count === 1 ? "receipt" : "receipts"}
                    </p>
                  </div>
                );
              })
            )}
          </div>


          {/* Row 3: Weekly expense trend placeholder */}
          <div className="rounded-[28px] bg-gradient-to-r from-[#f4f7ff] via-[#f3f6ff] to-[#f7f0ff] border border-[#e1e5ff] h-40 flex items-center justify-center text-sm text-slate-500">
            Weekly expense trend (coming soon)
          </div>
        </section>

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
                        {parsed.category || "Uncategorized"}
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
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              All receipts & AI details
            </h2>
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
                          S3:{" "}
                          <a
                            href={r.s3Url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-[11px] text-violet-600 underline"
                          >
                            {r.s3Url}
                          </a>
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
                      </div>
                    </div>

                    {parsed && (
                      <div className="mt-4 rounded-2xl bg-[#f6f0ff] border border-violet-100 px-4 py-3">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {parsed.merchant || "Unknown merchant"}
                          </p>
                          {parsed.category && (
                            <span className="text-xs rounded-full bg-white px-2 py-1 text-violet-700 border border-violet-200">
                              {parsed.category}
                            </span>
                          )}
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

                    {/* {parsed && (
                      <details className="mt-3 rounded-2xl bg-[#faf5ff] border border-violet-100 px-3 py-2">
                        <summary className="text-xs text-slate-700 cursor-pointer">
                          View raw extracted JSON
                        </summary>
                        <pre className="mt-2 text-[11px] text-slate-800 overflow-x-auto">
                          {JSON.stringify(parsed, null, 2)}
                        </pre>
                      </details>
                    )} */}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
