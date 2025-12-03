// app/components/landing/HowItWorks.tsx
export default function HowItWorks() {
    const steps = [
      {
        label: "Step 1",
        title: "Snap or upload a receipt",
        desc: "Capture a photo from your phone or drag & drop PDFs. Lekhya supports different layouts, currencies, and formats.",
        badge: "📸",
        bg: "bg-[#fff4cc]", // soft yellow
      },
      {
        label: "Step 2",
        title: "AI parses every detail",
        desc: "Our LLM reads the receipt and extracts merchant, date, totals, taxes, and line items into clean, structured data.",
        badge: "🤖",
        bg: "bg-[#e9ddff]", // soft purple
      },
      {
        label: "Step 3",
        title: "See it all in your dashboard",
        desc: "Expenses are auto-categorized so you can instantly see where your money goes across categories, merchants, and projects.",
        badge: "📊",
        bg: "bg-[#dff6ff]", // soft blue
      },
    ];
  
    return (
      <section
        id="how-it-works"
        className="w-full bg-[#f9f5ff] border-t border-slate-100 py-16 md:py-20"
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">
              How Lekhya works
            </h2>
            <p className="mt-3 text-sm md:text-base text-slate-600 max-w-2xl mx-auto">
              From crumpled paper to clean analytics in three simple steps. No
              manual entry, no spreadsheet gymnastics.
            </p>
          </div>
  
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.title}
                className={`${step.bg} rounded-3xl border border-white shadow-md p-6`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 rounded-2xl bg-white/70 flex items-center justify-center text-base">
                    {step.badge}
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    {step.label}
                  </span>
                </div>
  
                <h3 className="text-sm md:text-base font-semibold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  