import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/lib/passwords";
import { DEFAULT_SETTINGS } from "../src/lib/settings";
import { ensureOgImage, ensurePlaceholder } from "../scripts/placeholders";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const ADULT_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
const KID_SIZES = ["3-4", "5-6", "7-8", "9-10", "11-12", "13-14"];

type SeedProduct = {
  name: string;
  slug: string;
  audience: "MENS" | "WOMENS" | "BOYS" | "GIRLS" | "UNISEX";
  category: "TRACKSUITS" | "T_SHIRTS" | "HOODIES" | "SPORTSWEAR" | "ACCESSORIES";
  pricePence: number;
  compareAtPence?: number;
  featured?: boolean;
  description: string;
  sizes: string[];
  colours: string[];
  skuPrefix: string;
  /** Stock per variant; a few are set low or to zero so the stock page and sold-out states have something to show. */
  stock: (size: string, colour: string) => number;
};

const products: SeedProduct[] = [
  {
    name: "Signature Tracksuit",
    slug: "signature-tracksuit",
    audience: "MENS",
    category: "TRACKSUITS",
    pricePence: 6499,
    compareAtPence: 7499,
    featured: true,
    description: "The full set. Heavyweight cotton-blend hoodie and joggers with the crest on the chest and the script down the leg. Ribbed cuffs, deep pockets, built to be worn every day. Made of hustle, grit and loyalty.",
    sizes: ADULT_SIZES,
    colours: ["Black", "Grey"],
    skuPrefix: "RH-TS",
    stock: (size, colour) => (size === "3XL" && colour === "Grey" ? 0 : size === "XS" ? 3 : 12),
  },
  {
    name: "Crest Hoodie",
    slug: "crest-hoodie",
    audience: "MENS",
    category: "HOODIES",
    pricePence: 4499,
    featured: true,
    description: "The crest, front and centre. 400gsm brushed-back fleece, double-lined hood, kangaroo pocket. Blue and black, straight off the badge.",
    sizes: ADULT_SIZES,
    colours: ["Black", "Blue"],
    skuPrefix: "RH-HD",
    stock: (size) => (size === "2XL" ? 4 : 15),
  },
  {
    name: "Script Tee",
    slug: "script-tee",
    audience: "MENS",
    category: "T_SHIRTS",
    pricePence: 2499,
    description: "Rebellious Hustler script across the chest. 220gsm combed cotton, regular fit, holds its shape in the wash.",
    sizes: ADULT_SIZES,
    colours: ["Black", "White"],
    skuPrefix: "RH-TEE",
    stock: () => 20,
  },
  {
    name: "Kids Crest Tee",
    slug: "kids-crest-tee",
    audience: "BOYS",
    category: "T_SHIRTS",
    pricePence: 1699,
    featured: true,
    description: "The crest for the little hustlers. Soft cotton tee with a crew neck and the winged shield on the front. Ages 3 to 14.",
    sizes: KID_SIZES,
    colours: ["Black", "Blue"],
    skuPrefix: "RH-KT",
    stock: (size) => (size === "13-14" ? 2 : 10),
  },
  {
    name: "Snapback Cap",
    slug: "snapback-cap",
    audience: "UNISEX",
    category: "ACCESSORIES",
    pricePence: 1999,
    description: "Flat peak snapback with the script embroidered on the front and the crest on the side. One size, adjustable strap.",
    sizes: ["One size"],
    colours: ["Black"],
    skuPrefix: "RH-CAP",
    stock: () => 25,
  },
  {
    name: "Sports Shorts",
    slug: "sports-shorts",
    audience: "MENS",
    category: "SPORTSWEAR",
    pricePence: 2799,
    description: "Lightweight training shorts with a mesh liner, zipped back pocket and the script on the thigh. For the gym, the pitch or the sofa.",
    sizes: ADULT_SIZES,
    colours: ["Black", "Grey"],
    skuPrefix: "RH-SH",
    stock: (size) => (size === "XS" ? 0 : 14),
  },
  {
    name: "Women's Crop Hoodie",
    slug: "womens-crop-hoodie",
    audience: "WOMENS",
    category: "HOODIES",
    pricePence: 3999,
    featured: true,
    description: "Cropped, boxy and brushed soft inside. Dropped shoulders, raw hem, script on the back. Pairs with the joggers from the Signature set.",
    sizes: ADULT_SIZES.slice(0, 5),
    colours: ["Black", "Blue"],
    skuPrefix: "RH-WCH",
    stock: (size) => (size === "XL" ? 3 : 10),
  },
  {
    name: "Girls' Tracksuit",
    slug: "girls-tracksuit",
    audience: "GIRLS",
    category: "TRACKSUITS",
    pricePence: 4499,
    description: "Matching hoodie and joggers for the girls. Soft fleece, elasticated waist with a drawcord, crest on the chest. Ages 3 to 14.",
    sizes: KID_SIZES,
    colours: ["Black", "Pink"],
    skuPrefix: "RH-GTS",
    stock: () => 8,
  },
];

function skuFor(prefix: string, colour: string, size: string) {
  const c = colour.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
  const s = size.replace(/[^A-Za-z0-9]/g, "").toUpperCase() || "OS";
  return `${prefix}-${c}-${s}`;
}

async function seedAdmin() {
  const username = "hustler";
  const existing = await db.adminUser.findUnique({ where: { username } });
  if (existing) {
    console.log(`Admin user "${username}" already exists; password left as it is.`);
    return;
  }
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error("ADMIN_INITIAL_PASSWORD is not set (or is shorter than 8 characters). Put it in .env before seeding; it is never hard-coded.");
  }
  await db.adminUser.create({ data: { username, passwordHash: await hashPassword(password), mustChangePassword: true } });
  console.log(`Created admin user "${username}" (must change password on first login).`);
}

async function seedSettings() {
  await db.storeSettings.upsert({ where: { id: "default" }, create: DEFAULT_SETTINGS, update: {} });
  console.log("Settings in place.");
}

async function seedProducts() {
  for (const p of products) {
    const art = await ensurePlaceholder(p.slug, p.name, `${p.audience === "UNISEX" ? "Everyone" : p.audience.charAt(0) + p.audience.slice(1).toLowerCase()} / ${p.category.replace("_", "-").toLowerCase()}`);
    const fields = {
      name: p.name,
      description: p.description,
      audience: p.audience,
      category: p.category,
      pricePence: p.pricePence,
      compareAtPence: p.compareAtPence ?? null,
      featured: p.featured ?? false,
    };
    const existing = await db.product.findUnique({ where: { slug: p.slug } });
    // A sample that has been edited in the admin (isSample cleared) is left alone on reseed.
    const product = existing
      ? existing.isSample
        ? await db.product.update({ where: { id: existing.id }, data: fields })
        : existing
      : await db.product.create({ data: { ...fields, slug: p.slug, status: "LIVE", isSample: true } });
    const imageCount = await db.productImage.count({ where: { productId: product.id } });
    if (imageCount === 0) {
      await db.productImage.create({ data: { productId: product.id, url: art.url, thumbUrl: art.thumbUrl, storageKey: art.storageKey, thumbKey: art.thumbKey, alt: `${p.name} placeholder`, position: 0 } });
    }
    for (const colour of p.colours) {
      for (const size of p.sizes) {
        const sku = skuFor(p.skuPrefix, colour, size);
        await db.productVariant.upsert({
          where: { sku },
          create: { productId: product.id, size, colour, sku, stockQty: p.stock(size, colour) },
          update: {},
        });
      }
    }
  }
  console.log(`${products.length} sample products in place (marked as samples in the admin).`);
}

async function main() {
  await seedAdmin();
  await seedSettings();
  await seedProducts();
  await ensureOgImage();
  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
