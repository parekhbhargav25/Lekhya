import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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

    const exists = await prisma.user.findUnique({ where: { email } });
    console.log("user email ",email)
    if (exists) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashed, name },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (e: any) {
    console.error("Sign-up error", e);
    return NextResponse.json({ error: "Sign-up failed" }, { status: 500 });
  }
}