import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/lib/mail";
import { CODE_TTL_MS, generateCode, hashCode } from "@/lib/verification";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const name = String(body?.name || "").trim() || null;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing?.emailVerifiedAt) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: { password: hashed, name },
          select: { id: true, email: true },
        })
      : await prisma.user.create({
          data: { email, password: hashed, name },
          select: { id: true, email: true },
        });

    const code = generateCode();
    const codeHash = await hashCode(code);
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);

    await prisma.emailVerificationCode.deleteMany({ where: { userId: user.id } });
    await prisma.emailVerificationCode.create({
      data: { userId: user.id, codeHash, expiresAt },
    });

    await sendVerificationEmail(email, code);

    return NextResponse.json(
      { success: true, requiresVerification: true, email: user.email },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("Sign-up error", e);
    return NextResponse.json({ error: "Sign-up failed" }, { status: 500 });
  }
}