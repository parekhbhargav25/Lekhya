import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mail";
import {
  CODE_TTL_MS,
  RESEND_COOLDOWN_MS,
  generateCode,
  hashCode,
} from "@/lib/verification";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ success: true });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerifiedAt) {
      return NextResponse.json({ success: true });
    }

    const latest = await prisma.emailVerificationCode.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (latest) {
      const elapsed = Date.now() - latest.createdAt.getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        const waitSec = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        return NextResponse.json(
          { error: `Please wait ${waitSec}s before requesting another code.` },
          { status: 429 }
        );
      }
    }

    const code = generateCode();
    const codeHash = await hashCode(code);
    await prisma.emailVerificationCode.deleteMany({
      where: { userId: user.id },
    });
    await prisma.emailVerificationCode.create({
      data: {
        userId: user.id,
        codeHash,
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    });

    await sendVerificationEmail(email, code);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Resend error", e);
    return NextResponse.json({ error: "Failed to resend code" }, { status: 500 });
  }
}
