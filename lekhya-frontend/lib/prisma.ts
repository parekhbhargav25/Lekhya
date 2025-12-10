// // lib/prisma.ts
// import { PrismaClient } from "@prisma/client";
// import { Pool } from "pg";
// import { PrismaPg } from "@prisma/adapter-pg";

// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined;
// };

// const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// const adapter = new PrismaPg(pool);

// export const prisma =
//   globalForPrisma.prisma ??
//   new PrismaClient({
//     adapter,
//     log: ["error", "warn"]
//   });

// if (process.env.NODE_ENV !== "production") {
//   globalForPrisma.prisma = prisma;
// }


// lib/prisma.ts
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";

// Pull PrismaClient off the default export to avoid TS complaining about named exports
const { PrismaClient } = pkg as any;

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined;
};

// Initialize pool and adapter only if DATABASE_URL exists
// This prevents build-time errors when DATABASE_URL might not be set
let pool: Pool | null = null;
let adapter: PrismaPg | null = null;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    adapter = new PrismaPg(pool);
  } catch (err) {
    // Silently fail during build if connection can't be established
    console.warn("Failed to initialize database pool during build:", err);
  }
}

export const prisma =
  globalForPrisma.prisma ??
  (adapter
    ? new PrismaClient({
        adapter,
        log: ["error", "warn"],
      })
    : new PrismaClient({
        log: ["error", "warn"],
      }));

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
