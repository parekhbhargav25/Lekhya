// app/login/page.tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import googleimg from "@/public/google.png"
import Image from "next/image";


export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already signed in
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    const res = await signIn("credentials", {
      redirect: false,
      email: email.trim().toLowerCase(),
      password,
    });

    setSubmitting(false);

    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/dashboard");
  }

  async function handleGoogle() {
    setError(null);
    setSubmitting(true);
    // redirect flow handled by NextAuth
    await signIn("google", { callbackUrl: "/dashboard" });
    setSubmitting(false);
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundImage: "url('/auth-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Soft overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-white/10 pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="rounded-[32px] bg-white/30 border border-white/50 shadow-[0_24px_60px_rgba(15,23,42,0.25)] backdrop-blur-2xl px-8 py-8 sm:px-10 sm:py-10">
          {/* Top icon circle */}
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/70 shadow-md flex items-center justify-center mb-6">
            <span className="text-xl">🔑</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 text-center mb-1">
            Log in to Lekhya
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 text-center mb-8">
            Welcome back — sign in to view your dashboard and receipts.
          </p>

          {/* Google sign-in (optional, since you added GoogleProvider) */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 rounded-full
                      bg-white/70 border border-white/70 px-4 py-3
                      text-sm font-semibold text-slate-900 shadow-sm
                      hover:bg-white/80 transition
                      disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Image
              src={googleimg}
              alt="Google"
              width={50}
              height={50}
              className="object-contain"
            />
            <span>Continue with Google</span>
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/60" />
            <span className="text-[11px] text-slate-600">or</span>
            <div className="h-px flex-1 bg-white/60" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">
                Password
              </label>
              <div className="flex items-center gap-2 rounded-2xl bg-white/60 border border-white/70 px-3 py-2.5 shadow-sm">
                <span className="text-slate-400 text-sm">🔒</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  placeholder="Your password"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50/90 border border-red-100 rounded-2xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full px-4 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold shadow-[0_14px_40px_rgba(15,23,42,0.45)] hover:bg-slate-950 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Signing in…" : "Log in"}
            </button>
          </form>

          <p className="mt-5 text-[11px] sm:text-xs text-slate-600 text-center">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/sign-up")}
              className="text-violet-700 font-medium hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}