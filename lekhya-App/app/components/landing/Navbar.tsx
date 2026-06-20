// app/components/landing/Navbar.tsx
import { LekhyaLogo } from "../LekhyaLogo";
import { NavbarAuthButtons } from "../NavbarAuthButtons";

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-gradient-to-b from-[#f3ecff]/95 to-[#f3ecff]/85 backdrop-blur">
      <div className="w-full max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LekhyaLogo size={36} />
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
        <NavbarAuthButtons />
        </div>
      </div>
    </header>
  );
}
