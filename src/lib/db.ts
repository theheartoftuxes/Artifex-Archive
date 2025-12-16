// Singleton PrismaClient pattern required for Vercel serverless functions
// Prevents connection pool exhaustion by reusing a single client instance
// across all serverless function invocations in development
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["query"], // optional, remove in prod if needed
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// Export as 'db' for backward compatibility with existing codebase
export const db = prisma;
