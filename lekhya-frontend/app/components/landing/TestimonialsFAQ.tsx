// app/components/landing/TestimonialsFAQ.tsx
"use client";

import { motion } from "framer-motion";

type QA = { q: string; a: string };

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function TestimonialsFAQ() {
  const faqs: QA[] = [
    {
      q: "How accurate is the AI?",
      a: "For clear photos and standard receipts, Lekhya is highly accurate at reading totals, dates, and merchants. You always have a chance to review and edit before saving.",
    },
    {
      q: "Is my data secure?",
      a: "Receipts and extracted data are stored securely in the cloud with encryption in transit and at rest. Your data is never sold to third parties.",
    },
    {
      q: "Can I export my data?",
      a: "Yes. You’ll be able to export CSVs for your accountant or tax software, and we’re exploring direct integrations with popular tools.",
    },
    {
      q: "Who is Lekhya for?",
      a: "Freelancers, students, solo founders, and small business owners—anyone who hates manual expense tracking but cares about where their money goes.",
    },
  ];

  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={container}
      className="w-full bg-white border-t border-slate-100 py-16 md:py-20"
    >
      <div className="max-w-6xl mx-auto px-4 grid gap-10 lg:grid-cols-[1.1fr,1fr]">
        {/* Testimonials + pricing teaser */}
        <div className="space-y-6">
          <motion.h2 variants={item} className="text-3xl md:text-4xl font-semibold text-slate-900 mb-3">
            People who try Lekhya don&apos;t go back to spreadsheets.
          </motion.h2>

          <motion.div variants={item} className="grid gap-4 md:grid-cols-2">
            <motion.div variants={item}>
              <TestimonialCard
                name="Freelance designer"
                quote="I used to dump receipts into a folder and dread tax time. Now I just snap them and everything’s waiting for me in one place."
              />
            </motion.div>
            <motion.div variants={item}>
              <TestimonialCard
                name="Early-stage founder"
                quote="Lekhya makes it stupidly easy to see where our SaaS and travel spend is going. It’s become our lightweight finance dashboard."
              />
            </motion.div>
          </motion.div>

          <motion.div variants={item} className="mt-6 rounded-3xl border border-slate-100 bg-[#f9f5ff] p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-violet-600 mb-1">
              Pricing (coming soon)
            </p>
            <h3 className="text-sm md:text-base font-semibold text-slate-900 mb-2">
              Fair, simple pricing for individuals and small teams.
            </h3>
            <p className="text-sm text-slate-600 mb-3">
              We&apos;re finalizing plans for a generous free tier and a Pro
              plan for power users. Join the waitlist to get early access and
              launch pricing.
            </p>
            <a href="#waitlist" className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-[#7b61ff] to-[#a58fff] text-white text-xs md:text-sm font-semibold shadow-md hover:shadow-lg transition">
              Join the waitlist
            </a>
          </motion.div>
        </div>

        {/* FAQ */}
        <div>
          <motion.h3 variants={item} className="text-lg font-semibold text-slate-900 mb-4">
            Questions, answered.
          </motion.h3>
          <div className="space-y-4">
            {faqs.map((itemFaq) => (
              <motion.div
                key={itemFaq.q}
                variants={item}
                className="rounded-2xl border border-slate-100 bg-[#f8f7ff] p-4"
              >
                <p className="text-sm font-semibold text-slate-900 mb-1">
                  {itemFaq.q}
                </p>
                <p className="text-sm text-slate-600">{itemFaq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function TestimonialCard({ name, quote }: { name: string; quote: string }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between">
      <p className="text-sm text-slate-700 leading-relaxed mb-3">
        “{quote}”
      </p>
      <p className="text-xs font-medium text-slate-500">— {name}</p>
    </div>
  );
}
