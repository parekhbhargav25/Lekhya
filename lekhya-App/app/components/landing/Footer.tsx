"use client";

import { FormEvent, useState } from "react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("saving");
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const result = await response.json();
      if (!response.ok) {
        setStatus("error");
        setMessage(result?.error || "Unable to join the waitlist right now.");
        return;
      }

      setStatus("success");
      setMessage("You’re on the waitlist! We’ll email you when we launch.");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage("Something went wrong. Please try again later.");
    }
  }

  return (
    <footer id="waitlist" className="w-full bg-[#f3ecff] border-t border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-14 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl md:text-2xl font-semibold text-slate-900">
            See where automated finance can take you.
          </h3>
          <p className="mt-2 text-sm md:text-base text-slate-600 max-w-lg">
            Join the private beta and simplify your expense tracking forever.
            We&apos;ll only email you when there&apos;s something worth
            sharing.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full sm:w-64 px-3 py-2 rounded-full bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7b61ff]"
          />
          <button
            type="submit"
            disabled={status === "saving"}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-[#7b61ff] to-[#a58fff] text-white text-sm font-semibold shadow-md hover:shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "saving" ? "Joining…" : "Join the waitlist"}
          </button>
        </form>
      </div>

      {message ? (
        <div className={`max-w-6xl mx-auto px-4 pb-4 text-sm ${status === "success" ? "text-emerald-600" : "text-rose-600"}`}>
          {message}
        </div>
      ) : null}

      <div className="max-w-6xl mx-auto px-4 py-4 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
        <span>© {new Date().getFullYear()} Lekhya. All rights reserved.</span>
        <div className="flex gap-4">
          <button>Privacy</button>
          <button>Terms</button>
        </div>
      </div>
    </footer>
  );
}
  