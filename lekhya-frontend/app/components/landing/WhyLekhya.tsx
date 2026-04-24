"use client";

import { motion } from "framer-motion";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14 } },
};

const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.62, ease: "easeOut" as const} },
};

export default function WhyLekhya() {
  const pains = [
    {
      title: "Receipts everywhere, insights nowhere",
      desc: "Photos in your camera roll, emails in your inbox, paper in your wallet. When it’s time to see where the money went, everything is scattered.",
    },
    {
      title: "Manual entry is soul-destroying",
      desc: "Typing totals into spreadsheets, copying dates, guessing categories… it’s slow, error-prone, and always gets pushed to “later”.",
    },
    {
      title: "Tax season turns into detective work",
      desc: "Digging through old statements and folders to figure out what was business vs personal. You deserve better than yearly financial archaeology.",
    },
  ];

  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      variants={container}
      className="w-full bg-[#fdfbff] border-t border-slate-100 py-16 md:py-20"
    >
      <div className="max-w-6xl mx-auto px-4">
        <motion.div variants={item} className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">
            Expense tracking shouldn&apos;t feel this painful.
          </h2>
          <p className="mt-3 text-sm md:text-base text-slate-600 max-w-2xl mx-auto">
            Lekhya replaces messy spreadsheets and lost receipts with a single,
            AI-powered flow that captures everything for you—without changing
            how you live your life.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {pains.map((p) => (
            <motion.div
              key={p.title}
              variants={item}
              className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm"
            >
              <h3 className="text-sm md:text-base font-semibold text-slate-900 mb-2">
                {p.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
  