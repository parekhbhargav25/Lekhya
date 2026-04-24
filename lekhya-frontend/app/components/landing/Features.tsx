// app/components/landing/Features.tsx
"use client";

import { motion } from "framer-motion";
import FeatureCard from "./FeatureCard";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } },
};

export default function Features() {
  const features = [
    {
      title: "LLM-powered extraction",
      desc: "Stop typing numbers. Lekhya reads each receipt and turns it into structured data you can actually use.",
      icon: "🧠",
      bg: "bg-[#f3fbff]",
    },
    {
      title: "Smart categories & tags",
      desc: "Auto-categorization for common merchants, with custom tags for trips, clients, and projects.",
      icon: "🏷️",
      bg: "bg-[#f9f5ff]",
    },
    {
      title: "Beautiful expense analytics",
      desc: "Clean charts and summaries that make it obvious what you’re spending on—and what to cut back on.",
      icon: "📈",
      bg: "bg-[#fff9f2]",
    },
    {
      title: "Secure cloud storage",
      desc: "Receipts are stored safely on AWS with encryption and strict access controls.",
      icon: "🔐",
      bg: "bg-[#f2fdf7]",
    },
    {
      title: "Export & collaboration",
      desc: "Export CSVs for your accountant or tax software, and share access when you need to.",
      icon: "📤",
      bg: "bg-[#fef6ff]",
    },
    {
      title: "Built for small teams",
      desc: "Freelancers, founders, and small teams who want clarity, not a full-blown accounting degree.",
      icon: "👥",
      bg: "bg-[#f7fbff]",
    },
  ];

  return (
    <section
      id="features"
      className="w-full bg-[#fdfbff] py-16 md:py-20 border-t border-slate-100"
    >
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          variants={container}
          className="text-center mb-10"
        >
          <motion.h2 variants={item} className="text-3xl md:text-4xl font-semibold text-slate-900">
            Everything you need. Nothing you don&apos;t.
          </motion.h2>
          <motion.p variants={item} className="mt-3 text-sm md:text-base text-slate-600 max-w-2xl mx-auto">
            Lekhya gives you a complete view of your spending without burying
            you in complexity. Simple enough to start today, powerful enough to
            grow with you.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={container}
          className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
        >
          {features.map((f) => (
            <motion.div key={f.title} variants={item}>
              <FeatureCard title={f.title} desc={f.desc} icon={f.icon} bg={f.bg} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
