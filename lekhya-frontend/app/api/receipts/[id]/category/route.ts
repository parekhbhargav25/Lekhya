// app/api/receipts/[id]/category/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type RouteParams = {
  params: { id: string };
};

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { error: "Missing receipt id" },
      { status: 400 }
    );
  }

  // ✅ Auth – only allow the logged-in user to change their own category
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email;

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Read new category from body
  const body = await req.json().catch(() => null);
  const category = (body?.category as string | undefined)?.trim();

  if (!category) {
    return NextResponse.json(
      { error: "Missing category" },
      { status: 400 }
    );
  }

  try {
    // Make sure the receipt belongs to this user
    const existing = await prisma.receipt.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.receipt.update({
      where: { id },
      data: { categoryOverride: category },
    });

    return NextResponse.json({ receipt: updated }, { status: 200 });
  } catch (err) {
    console.error("Error updating category", err);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}