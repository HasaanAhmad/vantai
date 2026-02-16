import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "src/prisma/schema.prisma",
  migrations: {
    path: "src/prisma/migrations",
  },
  datasource: {
    // Use DIRECT_DATABASE_URL for migrations when using Prisma Accelerate; else DATABASE_URL
    url:
      process.env.DIRECT_DATABASE_URL ??
      process.env.DATABASE_URL ??
      env("DATABASE_URL"),
  },
});

