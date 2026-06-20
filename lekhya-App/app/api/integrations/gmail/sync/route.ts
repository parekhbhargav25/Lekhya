import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractReceiptFromEmailLLM } from "@/lib/extract";
import {
  getValidGmailAccessToken,
  listGmailMessageIds,
  getGmailMessage,
  parseGmailMessage,
} from "@/lib/gmail";

export const runtime = "nodejs";

const GMAIL_QUERY =
  'subject:(receipt OR "your order" OR "order confirmation" OR invoice) newer_than:90d';
const MAX_MESSAGES_PER_SYNC = 25;

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getValidGmailAccessToken(userId);

  if (status.state === "missing") {
    return NextResponse.json(
      { error: "Gmail not connected", action: "connect" },
      { status: 400 }
    );
  }
  if (status.state === "scope_missing") {
    return NextResponse.json(
      { error: "Gmail read permission not granted", action: "reconnect" },
      { status: 403 }
    );
  }
  if (status.state === "refresh_failed") {
    return NextResponse.json(
      { error: "Gmail session expired, please reconnect", action: "reconnect" },
      { status: 401 }
    );
  }

  const accessToken = status.accessToken;

  let messageIds: string[];
  try {
    messageIds = await listGmailMessageIds(
      accessToken,
      GMAIL_QUERY,
      MAX_MESSAGES_PER_SYNC
    );
  } catch (err) {
    console.error("Gmail list error", err);
    return NextResponse.json(
      { error: "Failed to list Gmail messages" },
      { status: 502 }
    );
  }

  if (messageIds.length === 0) {
    return NextResponse.json({ synced: 0, skipped: 0, discarded: 0 });
  }

  const existing = await prisma.receipt.findMany({
    where: { userId, source: "gmail", externalId: { in: messageIds } },
    select: { externalId: true },
  });
  const existingIds = new Set(
    existing.map((r: { externalId: string | null }) => r.externalId).filter(Boolean) as string[]
  );
  const newIds = messageIds.filter((id) => !existingIds.has(id));

  let synced = 0;
  let discarded = 0;

  for (const messageId of newIds) {
    try {
      const msg = await getGmailMessage(accessToken, messageId);
      const parsed = parseGmailMessage(msg);

      if (!parsed.bodyText || parsed.bodyText.length < 40) {
        discarded++;
        continue;
      }

      const extracted = await extractReceiptFromEmailLLM({
        subject: parsed.subject,
        from: parsed.from,
        date: parsed.date,
        body: parsed.bodyText,
      });

      // Skip if the LLM deemed it a non-receipt
      if (!extracted.merchant || typeof extracted.total !== "number") {
        discarded++;
        continue;
      }

      await prisma.receipt.create({
        data: {
          userId,
          source: "gmail",
          externalId: messageId,
          s3Key: null,
          s3Url: null,
          status: "parsed",
          extractedJson: extracted as any,
        },
      });
      synced++;
    } catch (err) {
      console.error(`Gmail sync failed for message ${messageId}:`, err);
      discarded++;
    }
  }

  return NextResponse.json({
    synced,
    skipped: existingIds.size,
    discarded,
  });
}
