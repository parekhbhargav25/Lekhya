import { prisma } from "./prisma";

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const REQUIRED_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

export type GmailAccountStatus =
  | { state: "connected"; accessToken: string }
  | { state: "missing" }
  | { state: "scope_missing" }
  | { state: "refresh_failed" };

export function hasGmailScope(scope: string | null | undefined): boolean {
  if (!scope) return false;
  return scope.split(/\s+/).includes(REQUIRED_SCOPE);
}

export async function getValidGmailAccessToken(
  userId: string
): Promise<GmailAccountStatus> {
  const account = await prisma.googleAccount.findUnique({ where: { userId } });
  if (!account) return { state: "missing" };
  if (!hasGmailScope(account.scope)) return { state: "scope_missing" };

  const now = Date.now();
  const expiresAtMs = account.expiresAt ? account.expiresAt.getTime() : 0;
  const isExpiringSoon = expiresAtMs - now < 60_000;

  if (!isExpiringSoon) {
    return { state: "connected", accessToken: account.accessToken };
  }

  if (!account.refreshToken) return { state: "refresh_failed" };

  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    refresh_token: account.refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    console.error("Gmail token refresh failed", await res.text());
    return { state: "refresh_failed" };
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
    scope?: string;
  };

  const newExpiresAt = new Date(Date.now() + json.expires_in * 1000);

  await prisma.googleAccount.update({
    where: { userId },
    data: {
      accessToken: json.access_token,
      expiresAt: newExpiresAt,
      ...(json.scope ? { scope: json.scope } : {}),
    },
  });

  return { state: "connected", accessToken: json.access_token };
}

export async function listGmailMessageIds(
  accessToken: string,
  query: string,
  maxResults = 25
): Promise<string[]> {
  const url = new URL(`${GMAIL_BASE}/messages`);
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(maxResults));

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Gmail list failed (${res.status}): ${await res.text()}`);
  }
  const json = (await res.json()) as {
    messages?: { id: string; threadId: string }[];
  };
  return (json.messages ?? []).map((m) => m.id);
}

type GmailMessage = {
  id: string;
  payload: GmailPayload;
  internalDate: string;
};

type GmailPayload = {
  mimeType: string;
  headers: { name: string; value: string }[];
  body?: { data?: string; size?: number };
  parts?: GmailPayload[];
};

export async function getGmailMessage(
  accessToken: string,
  messageId: string
): Promise<GmailMessage> {
  const res = await fetch(`${GMAIL_BASE}/messages/${messageId}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Gmail get failed (${res.status}): ${await res.text()}`);
  }
  return (await res.json()) as GmailMessage;
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data, "base64url").toString("utf-8");
}

function extractBody(payload: GmailPayload): string {
  if (payload.mimeType === "text/html" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.parts) {
    const html = payload.parts.find((p) => p.mimeType === "text/html");
    if (html?.body?.data) return decodeBase64Url(html.body.data);
    const text = payload.parts.find((p) => p.mimeType === "text/plain");
    if (text?.body?.data) return decodeBase64Url(text.body.data);
    for (const part of payload.parts) {
      const nested = extractBody(part);
      if (nested) return nested;
    }
  }
  if (payload.body?.data) return decodeBase64Url(payload.body.data);
  return "";
}

export function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

export function parseGmailMessage(msg: GmailMessage): {
  subject: string;
  from: string;
  date: string;
  bodyText: string;
} {
  const headers = msg.payload.headers || [];
  const hdr = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ??
    "";

  const raw = extractBody(msg.payload);
  const bodyText = /<[^>]+>/.test(raw) ? htmlToText(raw) : raw;

  return {
    subject: hdr("Subject"),
    from: hdr("From"),
    date: hdr("Date"),
    bodyText,
  };
}
