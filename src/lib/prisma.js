import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL ontbreekt.");
}

const globalForPrisma = globalThis;

function createPrismaClient() {
  const pool = new Pool({
    connectionString,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
  });
}

export const prisma = globalForPrisma.__prisma__ || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma__ = prisma;
}