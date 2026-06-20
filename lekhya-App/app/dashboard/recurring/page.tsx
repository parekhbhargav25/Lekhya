"use client";

import { useDashboard } from "../DashboardContext";

export default function RecurringPage() {
  const { recurring } = useDashboard();

  if (recurring.length === 0) {
    return (
      <section className="mb-10">
        <div className="rounded-3xl bg-white border border-slate-100 px-6 py-10 text-center">
          <p className="text-sm text-slate-500">
            No recurring expenses detected yet. As you add receipts, Lekhya will spot subscriptions and repeat charges automatically.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">
          Recurring expenses
        </h2>
        <p className="text-xs text-slate-500">
          {recurring.length} detected from your receipts
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
  );
}
