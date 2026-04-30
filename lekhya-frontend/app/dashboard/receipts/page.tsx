"use client";

import { useState } from "react";
import { useDashboard } from "../DashboardContext";

export default function ReceiptsPage() {
  const {
    receipts,
    runExtraction,
    runningId,
    openPreview,
    setFixingId,
    deleteReceipt,
    getCategory,
  } = useDashboard();

  const [search, setSearch] = useState("");

  if (receipts.length === 0) {
    return (
      <section className="mb-10">
        <div className="rounded-3xl bg-white border border-slate-100 px-6 py-10 text-center">
          <p className="text-sm text-slate-500">
            No receipts yet. Hit{" "}
            <span className="font-semibold text-violet-700">Upload</span> in the sidebar to get started.
          </p>
        </div>
      </section>
    );
  }

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
        <h2 className="text-sm font-semibold text-slate-900 shrink-0">All receipts</h2>
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
            No receipts match{" "}
            <span className="font-semibold text-slate-700">&ldquo;{search}&rdquo;</span>
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
                          await deleteReceipt(r.id);
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
                      <p
                        className="text-sm font-semibold text-slate-900 truncate"
                        title={parsed.merchant || "Unknown merchant"}
                      >
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
                      <p className="text-xs text-slate-500">Awaiting extraction</p>
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
}
