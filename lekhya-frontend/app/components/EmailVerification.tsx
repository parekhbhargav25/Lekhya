"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  email: string;
  onVerified: () => void | Promise<void>;
  onBack?: () => void;
};

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

export function EmailVerification({ email, onVerified, onBack }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function submit(code: string) {
    if (loading || verified) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid code");
        setShakeKey((k) => k + 1);
        setDigits(Array(CODE_LENGTH).fill(""));
        inputsRef.current[0]?.focus();
        return;
      }
      setVerified(true);
      setTimeout(() => onVerified(), 700);
    } catch {
      setError("Something went wrong. Try again.");
      setShakeKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(index: number, value: string) {
    const sanitized = value.replace(/\D/g, "");
    if (!sanitized) {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }

    if (sanitized.length > 1) {
      const chars = sanitized.slice(0, CODE_LENGTH - index).split("");
      setDigits((prev) => {
        const next = [...prev];
        chars.forEach((c, i) => {
          next[index + i] = c;
        });
        return next;
      });
      const nextIndex = Math.min(index + chars.length, CODE_LENGTH - 1);
      inputsRef.current[nextIndex]?.focus();

      const filled = [...digits];
      chars.forEach((c, i) => (filled[index + i] = c));
      if (filled.every((d) => d)) submit(filled.join(""));
      return;
    }

    setDigits((prev) => {
      const next = [...prev];
      next[index] = sanitized;
      if (next.every((d) => d)) submit(next.join(""));
      return next;
    });

    if (index < CODE_LENGTH - 1) inputsRef.current[index + 1]?.focus();
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
      setDigits((prev) => {
        const next = [...prev];
        next[index - 1] = "";
        return next;
      });
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-email/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resend code");
      } else {
        setCooldown(RESEND_SECONDS);
        setDigits(Array(CODE_LENGTH).fill(""));
        inputsRef.current[0]?.focus();
      }
    } finally {
      setResending(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-md"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.05, type: "spring", stiffness: 260, damping: 20 }}
        className="relative mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-400 to-amber-300"
      >
        <motion.span
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-400 to-amber-300 opacity-60 blur-lg"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative h-6 w-6"
        >
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      </motion.div>

      <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 mb-3">
        Check your email
      </h1>
      <p className="text-sm text-slate-500 mb-8">
        We sent a 6-digit code to{" "}
        <span className="font-semibold text-slate-700">{email}</span>. Enter it
        below to verify your account.
      </p>

      <motion.div
        key={shakeKey}
        animate={
          shakeKey > 0
            ? { x: [0, -10, 10, -8, 8, -4, 4, 0] }
            : { x: 0 }
        }
        transition={{ duration: 0.5 }}
        className="flex gap-2 sm:gap-3 mb-4"
      >
        {digits.map((digit, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i, duration: 0.3, ease: "easeOut" }}
            className="flex-1"
          >
            <motion.input
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={CODE_LENGTH}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={(e) => e.currentTarget.select()}
              disabled={loading || verified}
              animate={
                verified
                  ? {
                      borderColor: "#22c55e",
                      backgroundColor: "#f0fdf4",
                      scale: 1.02,
                    }
                  : error
                    ? { borderColor: "#ef4444", backgroundColor: "#fef2f2" }
                    : digit
                      ? { borderColor: "#8b5cf6", scale: 1.04 }
                      : { borderColor: "#e2e8f0", scale: 1 }
              }
              transition={{ duration: 0.18 }}
              className="w-full aspect-square rounded-2xl border-2 bg-white text-center text-2xl sm:text-3xl font-semibold text-slate-900 focus:outline-none"
            />
          </motion.div>
        ))}
      </motion.div>

      <div className="min-h-[24px] mb-4">
        <AnimatePresence mode="wait">
          {error && !verified && (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-xs text-red-600"
            >
              {error}
            </motion.p>
          )}
          {verified && (
            <motion.p
              key="verified"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600"
            >
              <motion.svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <motion.path d="M5 13l4 4L19 7" />
              </motion.svg>
              Verified — signing you in…
            </motion.p>
          )}
          {loading && !verified && !error && (
            <motion.p
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-slate-400"
            >
              Verifying…
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Didn't get it?{" "}
          <motion.button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending || verified}
            whileHover={cooldown === 0 ? { scale: 1.05 } : undefined}
            whileTap={cooldown === 0 ? { scale: 0.95 } : undefined}
            className="font-semibold text-violet-600 hover:text-violet-700 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            {resending
              ? "Sending…"
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend code"}
          </motion.button>
        </span>
        {onBack && (
          <motion.button
            type="button"
            onClick={onBack}
            whileHover={{ x: -2 }}
            className="font-semibold text-slate-600 hover:text-slate-900"
          >
            ← Use a different email
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
