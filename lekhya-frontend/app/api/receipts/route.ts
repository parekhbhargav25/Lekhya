// app/api/receipts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadReceiptToS3 } from "@/lib/s3";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // ✅ use DB user id (matches User.id FK)
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const { key, url } = await uploadReceiptToS3(file);

    const receipt = await prisma.receipt.create({
      data: {
        userId, // ✅ FK-safe now
        s3Key: key,
        s3Url: url,
        status: "uploaded",
      },
    });

    return NextResponse.json(
      { success: true, receiptId: receipt.id, s3Key: key, s3Url: url },
      { status: 200 }
    );
  } catch (err) {
    console.error("Upload error", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const receipts = await prisma.receipt.findMany({
      where: { userId }, // ✅
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ receipts }, { status: 200 });
  } catch (err) {
    console.error("List receipts error", err);
    return NextResponse.json({ error: "Failed to list receipts" }, { status: 500 });
  }
}