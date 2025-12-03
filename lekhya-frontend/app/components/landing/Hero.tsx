// app/components/landing/Hero.tsx
export default function Hero() {
    return (
      <div>
        <p className="inline-flex items-center rounded-full bg-white/70 border border-violet-100 px-3 py-1 text-xs font-medium text-violet-600 mb-5 shadow-sm">
          New • AI-powered receipt &amp; expense automation
        </p>
  
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-900 leading-tight">
          Your smart
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#5c4bff] via-[#8a7bff] to-[#30b3ff]">
            expense companion.
          </span>
        </h1>
  
        <p className="mt-5 text-base md:text-lg text-slate-600 max-w-xl">
          Snap a receipt, let AI extract the details, and see every dollar
          organized automatically—without spreadsheets, manual entry, or stress.
        </p>
  
        <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:items-center">
          <button className="px-6 py-3 rounded-full bg-gradient-to-r from-[#7b61ff] to-[#a58fff] text-white font-semibold text-sm md:text-base shadow-md hover:shadow-lg transition">
            Get started
          </button>
          <button className="px-6 py-3 rounded-full bg-white/80 border border-slate-200 text-slate-700 text-sm md:text-base shadow-sm hover:bg-white transition">
            Watch how it works
          </button>
        </div>
  
        <p className="mt-4 text-xs text-slate-500">
          No credit card required • Perfect for freelancers and small teams
        </p>
      </div>
    );
  }
  