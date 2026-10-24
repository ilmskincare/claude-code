import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * TLS: when DATABASE_SSL_CA holds a PEM certificate (e.g. Supabase's root CA),
 * the server certificate is verified against it. Never disable verification.
 */
function sslOptions() {
  const ca = process.env.DATABASE_SSL_CA?.replace(/\\n/g, "\n").trim();
  return ca ? { ca, rejectUnauthorized: true } : undefined;
}

function create() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, ssl: sslOptions(), max: 5 });
  return new PrismaClient({ adapter, log: process.env.PRISMA_LOG ? ["query", "warn", "error"] : ["warn", "error"] });
}

export const db: PrismaClient = globalForPrisma.prisma ?? create();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];
