import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasGmailScope } from "@/lib/gmail";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await prisma.googleAccount.findUnique({
    where: { userId },
    select: { scope: true, createdAt: true, updatedAt: true },
  });

  if (!account) {
    return NextResponse.json({ connected: false, scopeOk: false });
  }

  const lastSynced = await prisma.receipt.findFirst({
    where: { userId, source: "gmail" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  return NextResponse.json({
    connected: true,
    scopeOk: hasGmailScope(account.scope),
    connectedAt: account.createdAt,
    lastSyncedAt: lastSynced?.createdAt ?? null,
  });
}
