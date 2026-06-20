import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);

  if (body?.verified === true) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { emailVerifiedAt: new Date() },
      }),
      prisma.emailVerificationCode.deleteMany({ where: { userId: id } }),
    ]);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;

  const target = await prisma.user.findUnique({
    where: { id },
    select: { email: true },
  });
  if (target && target.email.toLowerCase() === admin.email) {
    return NextResponse.json(
      { error: "You can't delete your own admin account from here." },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
