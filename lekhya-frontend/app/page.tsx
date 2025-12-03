// app/page.tsx
import Navbar from "./components/landing/Navbar";
import Hero from "./components/landing/Hero";
import DashboardPreview from "./components/landing/DashboardPreview";
import WhyLekhya from "./components/landing/WhyLekhya";
import HowItWorks from "./components/landing/HowItWorks";
import UseCases from "./components/landing/UseCases";
import Features from "./components/landing/Features";
import TestimonialsFAQ from "./components/landing/TestimonialsFAQ";
import Footer from "./components/landing/Footer";
import Sparkles from "./components/landing/Sparkles";

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-[#f3ecff] text-slate-800 overflow-hidden">
      {/* Background gradient + clouds + sun */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#e8e6ff] via-[#f3ecff] to-[#ffffff]">
        {/* Cloudy blobs */}
        <div className="absolute -top-10 left-10 w-64 h-64 bg-white/80 rounded-full blur-3xl" />
        <div className="absolute top-32 right-0 w-72 h-72 bg-white/70 rounded-full blur-3xl" />
        <div className="absolute bottom-[-4rem] left-1/2 -translate-x-1/2 w-80 h-80 bg-white/75 rounded-full blur-3xl" />

        {/* Sun glow */}
        <div className="absolute top-24 right-32 w-44 h-44 rounded-full bg-gradient-to-br from-yellow-200 via-amber-300 to-orange-300 blur-xl opacity-80" />
        <Sparkles />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* Hero + dashboard preview */}
        <section className="w-full max-w-6xl mx-auto px-4 pt-16 pb-20">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
            <div className="flex-1 max-w-xl">
              <Hero />
            </div>
            <div className="flex-1 max-w-sm lg:max-w-md w-full">
              <DashboardPreview />
            </div>
          </div>
        </section>

        <WhyLekhya />
        <HowItWorks />
        <UseCases />
        <Features />
        <TestimonialsFAQ />
        <Footer />
      </div>
    </main>
  );
}
