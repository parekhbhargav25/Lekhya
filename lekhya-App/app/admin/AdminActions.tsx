"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export function UserActions({
  id,
  email,
  verified,
}: {
  id: string;
  email: string;
  verified: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function verify() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: true }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;
    if (!confirm(`Delete ${email}? This cascades to all their receipts.`)) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex items-center justify-end gap-1.5">
      {!verified && (
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          disabled={busy}
          onClick={verify}
          className="rounded-full bg-violet-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          Verify
        </motion.button>
      )}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        disabled={busy}
        onClick={remove}
        className="rounded-full border border-red-200 bg-white px-3 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Delete
      </motion.button>
    </div>
  );
}

export function ReceiptActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (busy) return;
    if (!confirm("Delete this receipt?")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/receipts/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      disabled={busy}
      onClick={remove}
      className="rounded-full border border-red-200 bg-white px-3 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      Delete
    </motion.button>
  );
}
