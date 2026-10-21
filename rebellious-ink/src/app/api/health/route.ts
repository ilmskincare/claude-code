import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailProviderConfigured, stripeConfigured, env } from "@/lib/env";

export async function GET() {
  const dbOk = await db.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
  return NextResponse.json({
    ok: dbOk,
    database: dbOk ? "ok" : "unreachable",
    email: emailProviderConfigured() ? "resend" : "dev-mailbox",
    payments: stripeConfigured() ? "stripe" : "not-configured",
    storage: env().STORAGE_DRIVER,
    environment: env().NODE_ENV,
  }, { status: dbOk ? 200 : 503 });
}
