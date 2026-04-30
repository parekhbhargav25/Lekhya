"use client";

import { GmailSyncCard } from "../GmailSyncCard";
import { useDashboard } from "../DashboardContext";

export default function GmailPage() {
  const { refresh } = useDashboard();

  return (
    <section className="mb-10">
      <GmailSyncCard onSynced={refresh} />
    </section>
  );
}
