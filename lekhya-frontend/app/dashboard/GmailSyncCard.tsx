"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

type GmailStatus = {
  connected: boolean;
  scopeOk: boolean;
  connectedAt?: string | null;
  lastSyncedAt?: string | null;
};

type SyncResult = {
  synced: number;
  skipped: number;
  discarded: number;
};

export function GmailSyncCard({ onSynced }: { onSynced?: () => void }) {
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [lastSync, setLastSync] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/integrations/gmail/status", {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = (await res.json()) as GmailStatus;
      setStatus(data);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  function connect() {
    signIn("google", { callbackUrl: "/dashboard?gmail=connected" });
  }

  async function disconnect() {
    if (
      !confirm(
        "Disconnect Gmail? Previously synced receipts will stay in your dashboard."
      )
    ) {
      return;
    }
    setDisconnecting(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/gmail/disconnect", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Disconnect failed");
      setLastSync(null);
      await fetchStatus();
    } catch (e: any) {
      setError(e.message || "Disconnect failed");
    } finally {
      setDisconnecting(false);
    }
  }

  async function sync() {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/gmail/sync", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.action === "connect" || data.action === "reconnect") {
          connect();
          return;
        }
        throw new Error(data.error || "Sync failed");
      }
      setLastSync(data as SyncResult);
      await fetchStatus();
      onSynced?.();
    } catch (e: any) {
      setError(e.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  const needsReconnect = status?.connected && !status?.scopeOk;
  const isConnected = status?.connected && status?.scopeOk;

  return (
    <section className="mb-8 rounded-3xl bg-white border border-violet-100 shadow-sm px-5 py-4 sm:px-6 sm:py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f3ebff] to-[#faf5ff] border border-violet-100">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-violet-600"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">
                Gmail expenses
              </p>
              {isConnected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Connected
                </span>
              )}
              {needsReconnect && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  Permission needed
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              {isConnected
                ? "Import order confirmations and receipts from your inbox automatically."
                : needsReconnect
                ? "Grant Lekhya read-only access to Gmail to import receipts."
                : "Connect your Gmail to pull purchase receipts into your dashboard."}
            </p>
            {isConnected && status?.lastSyncedAt && (
              <p className="text-[11px] text-slate-400 mt-1">
                Last synced receipt:{" "}
                {new Date(status.lastSyncedAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!status?.connected && (
            <button
              onClick={connect}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#7b61ff] to-[#a58fff] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-shadow"
            >
              Connect Gmail
            </button>
          )}

          {needsReconnect && (
            <button
              onClick={connect}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#7b61ff] to-[#a58fff] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-shadow"
            >
              Grant access
            </button>
          )}

          {isConnected && (
            <>
              <button
                onClick={sync}
                disabled={syncing}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#7b61ff] to-[#a58fff] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-shadow disabled:opacity-60"
              >
                {syncing ? "Syncing…" : "Sync now"}
              </button>
              <button
                onClick={disconnect}
                disabled={disconnecting}
                className="px-3 py-2 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                {disconnecting ? "Disconnecting…" : "Disconnect"}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-600">{error}</p>
      )}

      {lastSync && (
        <p className="mt-3 text-xs text-slate-600">
          Imported <span className="font-semibold">{lastSync.synced}</span> new
          receipt{lastSync.synced === 1 ? "" : "s"}
          {lastSync.skipped > 0 && (
            <> · {lastSync.skipped} already in dashboard</>
          )}
          {lastSync.discarded > 0 && (
            <> · {lastSync.discarded} skipped (not a receipt)</>
          )}
          .
        </p>
      )}
    </section>
  );
}
