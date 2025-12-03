// app/components/landing/Navbar.tsx
import Image from "next/image";
import lekhyaLogo from '../../../public/LekhyaLogo.png';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-gradient-to-b from-[#f3ecff]/95 to-[#f3ecff]/85 backdrop-blur">
      <div className="w-full max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src={lekhyaLogo}
            alt="Lekhya logo"
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
          <span className="font-semibold tracking-tight text-slate-900 text-xl">
            Lekhya
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-600">
          <a href="#how-it-works" className="hover:text-slate-900 transition-colors">
            How it works
          </a>
          <a href="#features" className="hover:text-slate-900 transition-colors">
            Features
          </a>
          <a href="#use-cases" className="hover:text-slate-900 transition-colors">
            Who it&apos;s for
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <button className="hidden sm:inline-flex text-sm px-4 py-2 rounded-full bg-white/70 border border-slate-200 text-slate-700 shadow-sm hover:bg-white transition-colors">
            Blog
          </button>
          <button className="text-sm px-5 py-2.5 rounded-full bg-gradient-to-r from-[#7b61ff] to-[#a58fff] text-white font-semibold shadow-md hover:shadow-lg transition">
            Join the waitlist
          </button>
        </div>
      </div>
    </header>
  );
}
