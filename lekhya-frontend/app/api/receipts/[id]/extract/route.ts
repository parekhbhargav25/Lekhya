import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  USE_MOCK_AI,
  extractReceiptFromImageMock,
  extractReceiptFromImageLLM,
} from "@/lib/extract";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // params must be awaited because of Next.js 14 dynamic API routing behavior
  const { id } = await params;

  if (!id) {
    console.error("Missing receipt id in URL");
    return NextResponse.json(
      { error: "Missing receipt id in URL" },
      { status: 400 }
    );
  }

  try {
    // 1️⃣ Fetch the receipt from the DB
    const receipt = await prisma.receipt.findUnique({ where: { id } });
    console.log("receipt is ", receipt);

    if (!receipt) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 }
      );
    }

    // 2️⃣ Run AI extraction (NOW `receipt.s3Url` exists, so no red underline)
    const extracted = await (USE_MOCK_AI
      ? extractReceiptFromImageMock({ s3Url: receipt.s3Url })
      : extractReceiptFromImageLLM({ s3Url: receipt.s3Url })
    );

    // 3️⃣ Update DB with parsed JSON
    const updated = await prisma.receipt.update({
      where: { id },
      data: {
        status: "parsed",
        extractedJson: extracted as any,
      },
    });

    // 4️⃣ Return result
    return NextResponse.json(
      { success: true, receipt: updated },
      { status: 200 }
    );
  } catch (err) {
    console.error("AI extraction error", err);

    // mark as error but don't block the response
    try {
      await prisma.receipt.update({
        where: { id },
        data: { status: "error" },
      });
    } catch {}

    return NextResponse.json(
      { error: "Extraction failed" },
      { status: 500 }
    );
  }
}
