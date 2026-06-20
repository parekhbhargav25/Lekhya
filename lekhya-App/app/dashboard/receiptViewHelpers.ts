import type { ReceiptRow } from "./DashboardContext";

export function gmailMessageUrl(
  messageId: string,
  authEmail?: string | null
): string {
  const base = "https://mail.google.com/mail/";
  const params = authEmail
    ? `?authuser=${encodeURIComponent(authEmail)}`
    : "";
  return `${base}${params}#all/${encodeURIComponent(messageId)}`;
}

export function canViewReceipt(r: ReceiptRow): boolean {
  if (r.source === "gmail") return !!r.externalId;
  return !!r.s3Url;
}

export function viewReceipt(
  r: ReceiptRow,
  opts: {
    userEmail?: string | null;
    openPreview: (url: string) => void;
  }
): void {
  if (r.source === "gmail" && r.externalId) {
    const url = gmailMessageUrl(r.externalId, opts.userEmail);
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    return;
  }
  if (r.s3Url) {
    opts.openPreview(r.s3Url);
  }
}
