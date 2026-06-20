"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useDashboard, type DuplicateGroup } from "../DashboardContext";
import { canViewReceipt, viewReceipt } from "../receiptViewHelpers";

export default function DuplicatesPage() {
  const { duplicates, deleteReceipt, dismissDuplicate, openPreview, receipts } =
    useDashboard();
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const [busyId, setBusyId] = useState<string | null>(null);

  if (duplicates.length === 0) {
    return (
      <section className="mb-10">
        <div className="rounded-3xl bg-white border border-slate-100 px-6 py-10 text-center">
          <p className="text-sm text-slate-500">
            No duplicate charges detected. Lekhya scans your receipts for the
            same merchant and amount within a few days and will surface anything
            suspicious here.
          </p>
        </div>
      </section>
    );
  }

  const totalAtRisk = duplicates.reduce(
    (sum, g) => sum + g.amount * (g.receipts.length - 1),
    0
  );

  async function handleDelete(receiptId: string) {
    if (!confirm("Delete this receipt? This cannot be undone.")) return;
    setBusyId(receiptId);
    try {
      await deleteReceipt(receiptId);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDismiss(group: DuplicateGroup) {
    setBusyId(group.fingerprint);
    try {
      await dismissDuplicate(
        group.fingerprint,
        group.receipts.map((r) => r.id)
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mb-10">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Possible duplicate charges
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {duplicates.length} {duplicates.length === 1 ? "group" : "groups"} ·
            up to{" "}
            <span className="font-semibold text-slate-900">
              ${totalAtRisk.toFixed(2)}
            </span>{" "}
            in potentially duplicated spend
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {duplicates.map((group) => {
          const isDismissing = busyId === group.fingerprint;
          return (
            <div
              key={group.fingerprint}
              className="rounded-3xl bg-white border border-amber-100 shadow-sm overflow-hidden"
            >
              <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-semibold text-slate-900 truncate">
                    {group.merchant}
                  </span>
                  <span className="text-[10px] rounded-full bg-white text-amber-700 border border-amber-200 px-2 py-0.5 capitalize whitespace-nowrap">
                    {group.reason === "same-day" ? "same day" : "within 3 days"}
                  </span>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">
                    {Math.round(group.confidence * 100)}% confidence
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-slate-900">
                    ${group.amount.toFixed(2)} each
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {group.receipts.length} charges
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {group.receipts.map((dup) => {
                  const full = receipts.find((r) => r.id === dup.id);
                  const isBusy = busyId === dup.id;
                  return (
                    <div
                      key={dup.id}
                      className="flex items-center justify-between gap-3 px-5 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-slate-700">
                          {dup.date}
                          {full?.extractedJson?.category && (
                            <span className="ml-2 text-slate-400">
                              · {full.extractedJson.category}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          uploaded {new Date(dup.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {full && canViewReceipt(full) && (
                          <button
                            onClick={() =>
                              viewReceipt(full, { userEmail, openPreview })
                            }
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                          >
                            {full.source === "gmail" ? "Open in Gmail" : "View"}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(dup.id)}
                          disabled={isBusy || isDismissing}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {isBusy ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-3 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => handleDismiss(group)}
                  disabled={isDismissing}
                  className="text-xs px-3 py-1.5 rounded-lg text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-50"
                >
                  {isDismissing ? "Dismissing…" : "Not a duplicate"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
