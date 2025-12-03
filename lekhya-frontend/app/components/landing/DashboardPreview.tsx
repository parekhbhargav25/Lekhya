// app/components/landing/DashboardPreview.tsx
export default function DashboardPreview() {
    const sample = [
      { merchant: "Whole Foods", amount: "$82.14", tag: "Groceries" },
      { merchant: "Uber Eats", amount: "$23.90", tag: "Dining" },
      { merchant: "Starbucks", amount: "$6.45", tag: "Coffee" },
    ];
  
    return (
      <div className="w-full rounded-3xl bg-white/80 border border-slate-200 shadow-xl backdrop-blur-md p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-slate-500">This month</p>
            <p className="text-xl md:text-2xl font-semibold text-slate-900">
              $3,482.90
            </p>
            <p className="text-xs text-emerald-500 mt-1">+18.2% vs last month</p>
          </div>
          <div className="rounded-full bg-violet-50 text-violet-600 px-3 py-1 text-xs font-medium border border-violet-100">
            AI summaries enabled
          </div>
        </div>
  
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-2xl bg-[#f3fbff] border border-sky-100 p-3">
            <p className="text-[11px] text-slate-500 mb-1">Groceries</p>
            <p className="text-sm font-semibold text-slate-900">$982.40</p>
            <p className="text-[11px] text-slate-500 mt-1">32 receipts</p>
          </div>
          <div className="rounded-2xl bg-[#f9f5ff] border border-violet-100 p-3">
            <p className="text-[11px] text-slate-500 mb-1">Dining out</p>
            <p className="text-sm font-semibold text-slate-900">$421.75</p>
            <p className="text-[11px] text-slate-500 mt-1">18 receipts</p>
          </div>
        </div>
  
        <div className="mt-1 h-24 rounded-2xl bg-gradient-to-tr from-[#7b61ff1a] via-[#38bdf81a] to-[#ecfeff] border border-slate-100 flex items-center justify-center text-[11px] text-slate-500">
          Weekly expense trend
        </div>
  
        <div className="mt-5 space-y-2">
          <p className="text-xs text-slate-500 mb-1">Recent receipts</p>
          {sample.map((r) => (
            <div
              key={r.merchant}
              className="flex items-center justify-between rounded-2xl bg-white border border-slate-100 px-3 py-2 shadow-sm"
            >
              <div>
                <span className="text-xs font-medium text-slate-900">
                  {r.merchant}
                </span>
                <div className="text-[11px] text-slate-500">
                  Auto • {r.tag}
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-900">
                {r.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  