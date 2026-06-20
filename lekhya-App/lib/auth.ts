// lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";
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

        if (!user.emailVerifiedAt) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return { id: user.id, email: user.email, name: user.name ?? null };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/gmail.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],

  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({ user, account }) {
      if (user?.email) {
        const dbUser = await prisma.user.upsert({
          where: { email: user.email.toLowerCase() },
          update: {
            name: user.name ?? undefined,
            emailVerifiedAt:
              account?.provider === "google" ? new Date() : undefined,
          },
          create: {
            email: user.email.toLowerCase(),
            name: user.name ?? null,
            emailVerifiedAt: account?.provider === "google" ? new Date() : null,
            // password stays null for Google users
          },
        });

        if (account?.provider === "google" && account.access_token) {
          const expiresAt =
            typeof account.expires_at === "number"
              ? new Date(account.expires_at * 1000)
              : null;

          await prisma.googleAccount.upsert({
            where: { userId: dbUser.id },
            update: {
              providerAccountId: account.providerAccountId,
              accessToken: account.access_token,
              refreshToken: account.refresh_token ?? undefined,
              expiresAt,
              scope: (account.scope as string | undefined) ?? null,
            },
            create: {
              userId: dbUser.id,
              providerAccountId: account.providerAccountId,
              accessToken: account.access_token,
              refreshToken: (account.refresh_token as string | undefined) ?? null,
              expiresAt,
              scope: (account.scope as string | undefined) ?? null,
            },
          });
        }
      }
      return true;
    },
  
    async jwt({ token, user }) {
      // Always map token.uid to your DB user id by email (works for Google + Credentials)
      const email =
        (user?.email ?? token.email)?.toString().trim().toLowerCase();
  
      if (email) {
        token.email = email;
        token.isAdmin = isAdminEmail(email);

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
        (session.user as any).isAdmin = Boolean(token.isAdmin);
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};