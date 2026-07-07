import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const client = new PrismaClient();
  // WAL keeps readers from blocking the (single) writer; busy_timeout makes
  // SQLite wait instead of erroring if the file is momentarily locked.
  // NOTE: these PRAGMAs return a result row, so $queryRawUnsafe is required
  // ($executeRawUnsafe rejects statements that return results on SQLite).
  client
    .$queryRawUnsafe("PRAGMA journal_mode=WAL;")
    .then(() => client.$queryRawUnsafe("PRAGMA busy_timeout=5000;"))
    .catch((err) => {
      console.error("Failed to apply SQLite pragmas:", err);
    });
  return client;
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
