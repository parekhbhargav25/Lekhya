// lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password || "";
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name ?? null };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({ user }) {
      if (user?.email) {
        await prisma.user.upsert({
          where: { email: user.email.toLowerCase() },
          update: { name: user.name ?? undefined },
          create: {
            email: user.email.toLowerCase(),
            name: user.name ?? null,
            // password stays null for Google users
          },
        });
      }
      return true;
    },
  
    async jwt({ token, user }) {
      // Always map token.uid to your DB user id by email (works for Google + Credentials)
      const email =
        (user?.email ?? token.email)?.toString().trim().toLowerCase();
  
      if (email) {
        token.email = email;
  
        const dbUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });
  
        if (dbUser) token.uid = dbUser.id;
      }
  
      return token;
    },
  
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.uid;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};