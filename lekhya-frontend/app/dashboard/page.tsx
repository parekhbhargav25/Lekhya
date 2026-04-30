"use client";

import { AnimatedNumber } from "../ui/AnimatedNumber";
import { FinanceInsightsChart } from "./FinanceInsightsChart";
import { ExpenseOverviewDonut } from "./ExpenseOverviewDonut";
import { useDashboard } from "./DashboardContext";

export default function OverviewPage() {
  const { receipts, isInRange, getCategory } = useDashboard();

  const receiptsInRange = receipts.filter((r) => isInRange(r.createdAt));

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
      ? `${monthOverMonthChange >= 0 ? "+" : ""}${monthOverMonthChange.toFixed(1)}% vs last month`
      : "No monthly data yet";

  const monthOverMonthTone =
    monthOverMonthChange == null
      ? "text-slate-500"
      : monthOverMonthChange >= 0
      ? "text-emerald-600"
      : "text-red-600";

  const recentReceipts = [...parsedReceipts]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  return (
    <>
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
              No parsed receipts yet. Upload from the sidebar and run AI extraction.
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
    </>
  );
}
