"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { LekhyaLogo } from "../LekhyaLogo";

const container = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.14, delayChildren: 0.18 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" as const } },
};

export default function Hero() {
  const { data: session } = useSession();
  const isSignedIn = Boolean(session?.user);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="space-y-6"
    >
      <motion.div variants={item} className="mb-2">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <LekhyaLogo size={72} glow />
        </motion.div>
      </motion.div>

      <motion.p variants={item} className="inline-flex items-center rounded-full bg-white/70 border border-violet-100 px-3 py-1 text-xs font-medium text-violet-600 mb-5 shadow-sm">
        New • AI-powered receipt &amp; expense automation
      </motion.p>

      <motion.h1 variants={item} className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-900 leading-tight">
        Your smart
        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#5c4bff] via-[#8a7bff] to-[#30b3ff]">
          expense companion.
        </span>
      </motion.h1>

      <motion.p variants={item} className="mt-5 text-base md:text-lg text-slate-600 max-w-xl">
        Snap a receipt, let AI extract the details, and see every dollar
        organized automatically—without spreadsheets, manual entry, or stress.
      </motion.p>

      <motion.div variants={item} className="mt-8 flex flex-col sm:flex-row gap-4 sm:items-center">
        <Link
          href={isSignedIn ? "/dashboard?upload=1" : "/login"}
          className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-[#7b61ff] to-[#a58fff] text-white font-semibold text-sm md:text-base shadow-md hover:shadow-lg transition"
        >
          {isSignedIn ? "Upload receipt" : "Get started"}
        </Link>
        {isSignedIn && (
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white/80 border border-slate-200 text-slate-700 text-sm md:text-base shadow-sm hover:bg-white transition"
          >
            Open dashboard
          </Link>
        )}
      </motion.div>

      <motion.p variants={item} className="mt-4 text-xs text-slate-500"></motion.p>
    </motion.div>
  );
}
