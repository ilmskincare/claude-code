import { db } from "./db";
import { SITE } from "./site";

export const DEFAULT_SETTINGS = {
  id: "default",
  shippingStandardPence: 395,
  shippingExpressPence: 695,
  freeShippingThresholdPence: 6000,
  announcement: "Free UK delivery on orders over £60",
  contactEmail: "hello@rebellioushustler.com",
  instagramHandle: SITE.instagramHandle,
  storeAddress: SITE.address,
};

export type Settings = typeof DEFAULT_SETTINGS & { updatedAt?: Date };

/** The single settings row, created with defaults on first read. */
export async function getSettings(): Promise<Settings> {
  const row = await db.storeSettings.findUnique({ where: { id: "default" } });
  if (row) return row;
  return db.storeSettings.create({ data: DEFAULT_SETTINGS });
}
