// app/api/receipts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { uploadReceiptToS3 } from "@/lib/s3";
import { prisma } from "@/lib/prisma";

// POST /api/receipts  -> upload + create DB row
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // upload to S3
    const { key, url } = await uploadReceiptToS3(file);

    // save in DB
    const receipt = await prisma.receipt.create({
      data: {
        userId: "demo-user",
        s3Key: key,
        s3Url: url,
        status: "uploaded",
      },
    });

    return NextResponse.json(
      {
        success: true,
        receiptId: receipt.id,
        s3Key: key,
        s3Url: url,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Upload error", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

// GET /api/receipts -> list receipts
export async function GET(req: NextRequest) {
  try {
    const receipts = await prisma.receipt.findMany({
      where: { userId: "demo-user" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ receipts }, { status: 200 });
  } catch (err) {
    console.error("List receipts error", err);
    return NextResponse.json(
      { error: "Failed to list receipts" },
      { status: 500 }
    );
  }
}
