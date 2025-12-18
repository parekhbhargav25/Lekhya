// app/signup/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";



export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { status } = useSession();


  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);
  
  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        Checking session…
      </main>
    );
  }


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign up failed");

      // auto-login after signup
      const login = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (login?.error) throw new Error("Account created, but login failed. Try logging in.");

      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      // ⬇️ Replace this with your own image path, e.g. '/images/lekhya-auth-bg.jpg'
      style={{
        backgroundImage:
          "url('/auth-bg.jpg')", // TODO: put your image file in public/auth-bg.jpg
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Soft overlay so text is readable over the image */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-white/10 pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="rounded-[32px] bg-white/30 border border-white/50 shadow-[0_24px_60px_rgba(15,23,42,0.25)] backdrop-blur-2xl px-8 py-8 sm:px-10 sm:py-10">
          {/* Top icon circle */}
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/70 shadow-md flex items-center justify-center mb-6">
            <span className="text-xl">🔒</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 text-center mb-1">
            Sign up with email
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 text-center mb-8">
            Create your Lekhya account and let AI organize all your receipts &
            expenses for you.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">
                Name (optional)
              </label>
              <div className="flex items-center gap-2 rounded-2xl bg-white/60 border border-white/70 px-3 py-2.5 shadow-sm">
                <span className="text-slate-400 text-sm">👤</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  placeholder="Bhargav Parekh"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">
                Email
              </label>
              <div className="flex items-center gap-2 rounded-2xl bg-white/60 border border-white/70 px-3 py-2.5 shadow-sm">
                <span className="text-slate-400 text-sm">✉️</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">
                Password
              </label>
              <div className="flex items-center gap-2 rounded-2xl bg-white/60 border border-white/70 px-3 py-2.5 shadow-sm">
                <span className="text-slate-400 text-sm">🔑</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50/90 border border-red-100 rounded-2xl px-3 py-2">
                {error}
              </p>
            )}

            {success && (
              <p className="text-xs text-emerald-700 bg-emerald-50/90 border border-emerald-100 rounded-2xl px-3 py-2">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full px-4 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold shadow-[0_14px_40px_rgba(15,23,42,0.45)] hover:bg-slate-950 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating account…" : "Get started"}
            </button>
          </form>

          <p className="mt-5 text-[11px] sm:text-xs text-slate-600 text-center">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-violet-700 font-medium hover:underline"
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}