"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useDashboard } from "./DashboardContext";
import { NAV, isNavActive } from "./nav";

export function MobileBottomNav() {
  const pathname = usePathname() ?? null;
  const { data: session } = useSession();
  const { setUploadOpen, downloadCsv } = useDashboard();
  const [open, setOpen] = useState(false);

  const isAdmin = (session?.user as { isAdmin?: boolean } | undefined)?.isAdmin;

  function getInitials(): string {
    const name = session?.user?.name?.trim();
    const email = session?.user?.email?.trim();
    if (name) {
      const parts = name.split(/\s+/);
      return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
    }
    if (email) return email[0].toUpperCase();
    return "U";
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      setOpen(false);
    }
  }

  return (
    <>
      {/* Persistent pull-tab — only on mobile */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-30
                   inline-flex items-center gap-2 rounded-full
                   bg-white/95 backdrop-blur border border-violet-200
                   px-4 py-2 shadow-lg
                   text-xs font-semibold text-violet-700
                   active:scale-95 transition-transform"
      >
        <span className="block h-1 w-8 rounded-full bg-violet-300" />
        <span>Menu</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/40"
            />
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={handleDragEnd}
              className="lg:hidden fixed inset-x-0 bottom-0 z-50
                         rounded-t-3xl bg-white shadow-2xl
                         max-h-[85vh] overflow-y-auto
                         pb-[env(safe-area-inset-bottom)]"
            >
              {/* Drag handle */}
              <div className="sticky top-0 bg-white pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing">
                <div className="h-1.5 w-12 rounded-full bg-slate-300" />
              </div>

              {/* Header */}
              <div className="px-5 pt-1 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#7b61ff] to-[#a58fff] text-white font-bold text-xs shadow-sm">
                    L
                  </span>
                  <span className="text-base font-semibold text-slate-900">Lekhya</span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Primary nav */}
              <nav className="px-3 space-y-1">
                {NAV.map((item) => {
                  const active = isNavActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-violet-100 text-violet-700"
                          : "text-slate-700 hover:bg-violet-50 hover:text-violet-700"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Upload CTA */}
              <div className="px-3 pt-3">
                <button
                  onClick={() => {
                    setOpen(false);
                    setUploadOpen(true);
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl
                             bg-gradient-to-r from-[#7b61ff] to-[#a58fff]
                             text-white text-sm font-semibold shadow-md"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Upload receipt
                </button>
              </div>

              {/* Settings / Admin */}
              <div className="px-3 pt-3 space-y-1">
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
                  </svg>
                  Settings
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                    </svg>
                    Admin
                  </Link>
                )}
              </div>

              {/* User footer */}
              <div className="mt-4 border-t border-slate-100 px-5 py-4 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-white text-sm font-semibold shadow-sm">
                  {getInitials()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {session?.user?.email}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-6 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setOpen(false);
                    downloadCsv();
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="M7 10l5 5 5-5" />
                    <path d="M12 15V3" />
                  </svg>
                  CSV
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <path d="M16 17l5-5-5-5" />
                    <path d="M21 12H9" />
                  </svg>
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
