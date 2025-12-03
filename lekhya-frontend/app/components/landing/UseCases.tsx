// app/components/landing/UseCases.tsx
export default function UseCases() {
    const useCases = [
      {
        label: "Freelancers & creators",
        title: "Stay on top of client & project expenses",
        desc: "Snap every coffee, software subscription, and travel receipt. Tag by client or project and export clean reports when it’s invoice or tax time.",
        icon: "🎨",
      },
      {
        label: "Solo founders & small teams",
        title: "See where every dollar of runway goes",
        desc: "Track SaaS, ads, travel, and random charges across cards and people. No finance team required—just a clear view of burn.",
        icon: "🚀",
      },
      {
        label: "Students & frequent travelers",
        title: "Separate personal, school, and trip spending",
        desc: "Keep study, work, and travel expenses cleanly separated with tags—so reimbursements and budgeting don’t become a guessing game.",
        icon: "🌍",
      },
    ];
  
    return (
      <section
        id="use-cases"
        className="w-full bg-white py-16 md:py-20 border-t border-slate-100"
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">
              Built for real people, not just accountants.
            </h2>
            <p className="mt-3 text-sm md:text-base text-slate-600 max-w-2xl mx-auto">
              Whether you&apos;re freelancing, running a lean startup, or just
              trying to be smarter with money, Lekhya keeps the numbers organized
              so you can focus on the work.
            </p>
          </div>
  
          <div className="grid gap-6 md:grid-cols-3">
            {useCases.map((u) => (
              <div
                key={u.label}
                className="rounded-3xl bg-[#f8f7ff] border border-slate-100 p-6 shadow-sm flex flex-col gap-3"
              >
                <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wide">
                  <span className="text-base">{u.icon}</span>
                  <span>{u.label}</span>
                </div>
                <h3 className="text-sm md:text-base font-semibold text-slate-900">
                  {u.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  