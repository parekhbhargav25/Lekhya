"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export function NavbarAuthButtons() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const loading = status === "loading";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

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
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
        aria-label="Open user menu"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold">
          {(session.user?.email?.[0] ?? session.user?.name?.[0] ?? "U").toUpperCase()}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-40 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Signed in as
            </p>
            <p className="mt-1 truncate text-sm font-medium text-slate-700">
              {session.user?.email}
            </p>
          </div>

          <div className="p-2">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Profile
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
