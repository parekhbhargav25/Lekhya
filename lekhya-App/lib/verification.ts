import { randomInt } from "crypto";
import bcrypt from "bcryptjs";

export const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_ATTEMPTS = 5;
export const RESEND_COOLDOWN_MS = 30 * 1000;

export function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export function compareCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}
