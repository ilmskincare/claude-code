import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";

/** Create a LIVE product with variants under a unique test slug. Everything is removed by cleanupTestData. */
export async function createTestProduct(opts: { pricePence?: number; variants?: { size: string; colour: string; stockQty: number }[] } = {}) {
  const tag = randomUUID().slice(0, 8);
  const variants = opts.variants ?? [
    { size: "M", colour: "Black", stockQty: 5 },
    { size: "L", colour: "Black", stockQty: 0 },
  ];
  return db.product.create({
    data: {
      name: `Test Tee ${tag}`,
      slug: `test-tee-${tag}`,
      description: "Integration test product",
      audience: "MENS",
      category: "T_SHIRTS",
      pricePence: opts.pricePence ?? 2499,
      status: "LIVE",
      variants: { create: variants.map((v) => ({ ...v, sku: `TEST-${tag}-${v.colour.slice(0, 3).toUpperCase()}-${v.size}` })) },
    },
    include: { variants: true },
  });
}

export async function cleanupTestData() {
  await db.order.deleteMany({ where: { stripeSessionId: { startsWith: "cs_test_rh_" } } });
  await db.webhookEvent.deleteMany({ where: { eventId: { startsWith: "evt_test_rh_" } } });
  await db.product.deleteMany({ where: { slug: { startsWith: "test-tee-" } } });
  await db.cart.deleteMany({ where: { items: { none: {} }, createdAt: { lt: new Date(Date.now() - 60_000) } } });
  await db.adminUser.deleteMany({ where: { username: { startsWith: "test-admin-" } } });
  await db.auditLog.deleteMany({ where: { actor: { startsWith: "test-admin-" } } });
}
