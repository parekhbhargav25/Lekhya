// app/sign-up/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import googleimg from "@/public/google.png";
import { AuthHeroPanel } from "../components/AuthHeroPanel";

export default function SignupPage() {
  const router = useRouter();
  const { status } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const login = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (login?.error)
        throw new Error("Account created, but login failed. Try logging in.");

      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#1a1512]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_1.1fr]">
        <AuthHeroPanel />

        <div className="relative flex flex-col bg-white lg:rounded-l-[40px]">
          <div className="flex items-center justify-between px-6 sm:px-10 lg:px-14 pt-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="relative inline-flex h-7 w-7 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-500 via-fuchsia-400 to-amber-300" />
                <span className="relative h-3.5 w-3.5 rounded-full bg-white" />
              </span>
              <span className="text-xl font-semibold tracking-tight text-slate-900">
                Lekhya
              </span>
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <path d="M10 17l5-5-5-5" />
                  <path d="M15 12H3" />
                </svg>
              </span>
              Sign In
            </Link>
          </div>

          <div className="flex flex-1 items-center px-6 sm:px-10 lg:px-14 py-6">
            <div className="w-full max-w-md">
              <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight text-slate-900 mb-2">
                Sign Up
              </h1>
              <p className="text-sm text-slate-500 mb-8">
                Let AI organize all your receipts &amp; expenses
              </p>

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="rounded-2xl border border-slate-200 px-5 py-3.5 focus-within:border-slate-400 transition">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 px-5 py-3.5 focus-within:border-slate-400 transition">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="Email"
                    className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 px-5 py-3.5 focus-within:border-slate-400 transition">
                  <div className="flex items-center gap-3">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="shrink-0 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <path d="m1 1 22 22" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7b61ff] via-[#8b5cf6] to-[#c084fc] py-4 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(139,92,246,0.35)] hover:shadow-[0_18px_48px_rgba(139,92,246,0.5)] transition disabled:opacity-60"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  {loading ? "Creating account…" : "Create account"}
                </button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] text-slate-400">or</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 transition disabled:opacity-60"
              >
                <Image src={googleimg} alt="Google" width={18} height={18} className="object-contain" />
                Continue with Google
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-6 sm:px-10 lg:px-14 pb-8 pt-6 text-xs text-slate-500">
            <span>© 2025 Lekhya Inc.</span>
            <div className="flex items-center gap-5">
              <Link href="/" className="hover:text-slate-700">
                Contact Us
              </Link>
              <span className="inline-flex items-center gap-1">
                English
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
