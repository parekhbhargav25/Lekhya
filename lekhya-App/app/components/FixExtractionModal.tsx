"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Extracted = {
  merchant?: string | null;
  date?: string | null;
  total?: number | null;
  tax?: number | null;
  currency?: string | null;
  category?: string | null;
  paymentMethod?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  receiptId: string;
  current: Extracted | null;
  onSuccess: (updated: { extractedJson: unknown; status: string }) => void;
};

export function FixExtractionModal({
  open,
  onClose,
  receiptId,
  current,
  onSuccess,
}: Props) {
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFeedback("");
      setError(null);
    }
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!feedback.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/receipts/${receiptId}/re-extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: feedback.trim() }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Re-extraction failed");
        return;
      }
      onSuccess(data.receipt);
      onClose();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={submitting ? undefined : onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative w-full max-w-lg rounded-3xl bg-white shadow-xl"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
          >
            <form onSubmit={submit} className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Fix this extraction
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Tell the AI what it got wrong. It will re-read the image with
                    your hint.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  aria-label="Close"
                  className="-m-2 p-2 text-slate-400 hover:text-slate-700 disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {current && (
                <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Current extraction
                  </p>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                    <FieldRow label="Merchant" value={current.merchant} />
                    <FieldRow label="Date" value={current.date} />
                    <FieldRow
                      label="Total"
                      value={
                        typeof current.total === "number"
                          ? `${current.currency || "$"}${current.total.toFixed(2)}`
                          : null
                      }
                    />
                    <FieldRow
                      label="Tax"
                      value={
                        typeof current.tax === "number"
                          ? `${current.currency || "$"}${current.tax.toFixed(2)}`
                          : null
                      }
                    />
                    <FieldRow label="Category" value={current.category} />
                    <FieldRow label="Payment" value={current.paymentMethod} />
                  </dl>
                </div>
              )}

              <label className="mb-1 block text-sm font-medium text-slate-700">
                What's wrong?
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="e.g., The total should be $42.30, not $4.23. The merchant is Costco, not Cosco."
                disabled={submitting}
                autoFocus
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none disabled:opacity-60"
              />
              <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                <span>Be specific. The AI will verify against the image.</span>
                <span>{feedback.length}/1000</span>
              </div>

              {error && (
                <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {error}
                </p>
              )}

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  disabled={submitting || !feedback.trim()}
                  whileHover={
                    submitting || !feedback.trim() ? undefined : { scale: 1.02 }
                  }
                  whileTap={
                    submitting || !feedback.trim() ? undefined : { scale: 0.98 }
                  }
                  className="rounded-full bg-gradient-to-r from-[#7b61ff] to-[#a58fff] px-5 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-50"
                >
                  {submitting ? "Re-extracting…" : "Submit & re-extract"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FieldRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <>
      <dt className="text-[11px] uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd className="text-slate-800 truncate">
        {value || <span className="text-slate-400">—</span>}
      </dd>
    </>
  );
}
