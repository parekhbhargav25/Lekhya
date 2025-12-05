"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export function NavbarAuthButtons() {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  if (loading) {
    return (
      <button
        className="text-xs text-slate-500 rounded-full border border-slate-200 px-3 py-1.5 bg-white"
        disabled
      >
        Checking…
      </button>
    );
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn(undefined, { callbackUrl: "/dashboard" })}
        className="text-xs font-medium text-slate-700 rounded-full border border-slate-200 px-3 py-1.5 bg-white"
      >
        Sign in
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-600 max-w-[140px] truncate">
        {session.user?.email}
      </span>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-xs font-medium text-slate-700 rounded-full border border-slate-200 px-3 py-1.5 bg-white"
      >
        Sign out
      </button>
    </div>
  );
}
