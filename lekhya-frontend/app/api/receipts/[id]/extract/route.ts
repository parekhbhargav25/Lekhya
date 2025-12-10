// app/api/receipts/[id]/extract/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  USE_MOCK_AI,
  extractReceiptFromImageLLM,
  extractReceiptFromImageMock,
} from "@/lib/extract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// In your Next version, params is wrapped in a Promise for app routes
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  // 🔹 MUST await context.params, otherwise id is undefined
  const { id } = await context.params;

  if (!id) {
    console.error("Missing receipt id in URL:", context);
    return NextResponse.json(
      { error: "Missing receipt id in URL" },
      { status: 400 }
    );
  }

  // 🔐 Auth check
  const session = await auth();
  const userId =
    (session?.user as any)?.id ??
    (session?.user as any)?.email ??
    null;

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized: missing user id" },
      { status: 401 }
    );
  }

  try {
    // 1) Make sure this receipt actually belongs to this user
    const receipt = await prisma.receipt.findFirst({
      where: { id, userId },
    });

    if (!receipt) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 }
      );
    }

    // 2) Call direct OpenAI extractor (or mock)
    const extracted = await (USE_MOCK_AI
      ? extractReceiptFromImageMock({ s3Url: receipt.s3Url })
      : extractReceiptFromImageLLM({ s3Url: receipt.s3Url }));

    // 3) Save in DB
    const updated = await prisma.receipt.update({
      where: { id: receipt.id },
      data: {
        status: "parsed",
        extractedJson: extracted,
      },
    });

    return NextResponse.json(
      { success: true, receipt: updated },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Extract error", err);

    // Best-effort mark as error if id is valid
    try {
      await prisma.receipt.update({
        where: { id },
        data: { status: "error" },
      });
    } catch (inner) {
      console.error("Failed to mark receipt as error", inner);
    }

    return NextResponse.json(
      { error: err.message || "AI extraction failed" },
      { status: 500 }
    );
  }
}