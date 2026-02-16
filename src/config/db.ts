import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";

const databaseUrl = process.env.DATABASE_URL;
const isAccelerate =
  typeof databaseUrl === "string" && databaseUrl.startsWith("prisma://");

type PrismaClientInstance = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientInstance | undefined;
};

function createPrismaClient() {
  if (isAccelerate) {
    if (!databaseUrl) throw new Error("DATABASE_URL required for Prisma Accelerate");
    const base = new PrismaClient({ accelerateUrl: databaseUrl });
    return base.$extends(withAccelerate());
  }
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
