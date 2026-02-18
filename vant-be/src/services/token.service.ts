/**
 * Access token service - creates and validates tokens for frontend auth.
 */

import { randomBytes } from "node:crypto";
import { prisma } from "@/config/db";

const TOKEN_EXPIRY_DAYS = 30;

export async function createAccessToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

  await prisma.accessToken.create({
    data: { token, userId, expiresAt },
  });

  return token;
}

export async function validateAccessToken(
  token: string
): Promise<{ userId: string } | null> {
  const record = await prisma.accessToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record || record.expiresAt < new Date()) {
    return null;
  }

  return { userId: record.userId };
}

export async function revokeAccessToken(token: string): Promise<void> {
  await prisma.accessToken.deleteMany({ where: { token } });
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.accessToken.deleteMany({ where: { userId } });
}
