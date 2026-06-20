import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayReceiptUploadStats } from "@/lib/receipt-upload-limit";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [user, totalReceipts, parsedReceipts, uploadLimit, recentReceipts] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          password: true,
        },
      }),
      prisma.receipt.count({
        where: { userId },
      }),
      prisma.receipt.count({
        where: {
          userId,
          status: "parsed",
        },
      }),
      getTodayReceiptUploadStats(prisma, userId),
      prisma.receipt.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          s3Url: true,
          status: true,
          createdAt: true,
          extractedJson: true,
          categoryOverride: true,
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        profile: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          authProvider: user.password ? "Email & Password" : "Google",
          totalReceipts,
          parsedReceipts,
          uploadLimit,
          recentReceipts,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Profile fetch error", err);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Profile delete error", err);
    return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 });
  }
}
