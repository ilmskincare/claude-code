import type { Audience, Category, ProductStatus } from "@/generated/prisma/enums";

export const AUDIENCE_LABEL: Record<Audience, string> = {
  MENS: "Mens",
  WOMENS: "Womens",
  BOYS: "Boys",
  GIRLS: "Girls",
  UNISEX: "Everyone",
};

export const AUDIENCE_SLUG: Record<Audience, string> = {
  MENS: "mens",
  WOMENS: "womens",
  BOYS: "boys",
  GIRLS: "girls",
  UNISEX: "everyone",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  TRACKSUITS: "Tracksuits",
  T_SHIRTS: "T-shirts",
  HOODIES: "Hoodies",
  SPORTSWEAR: "Sportswear",
  ACCESSORIES: "Accessories",
};

export const CATEGORY_SLUG: Record<Category, string> = {
  TRACKSUITS: "tracksuits",
  T_SHIRTS: "t-shirts",
  HOODIES: "hoodies",
  SPORTSWEAR: "sportswear",
  ACCESSORIES: "accessories",
};

export const STATUS_LABEL: Record<ProductStatus, string> = {
  DRAFT: "Draft",
  LIVE: "Live",
  ARCHIVED: "Archived",
};

export function audienceFromSlug(slug: string | undefined): Audience | null {
  const hit = (Object.entries(AUDIENCE_SLUG) as [Audience, string][]).find(([, s]) => s === slug);
  return hit ? hit[0] : null;
}

export function categoryFromSlug(slug: string | undefined): Category | null {
  const hit = (Object.entries(CATEGORY_SLUG) as [Category, string][]).find(([, s]) => s === slug);
  return hit ? hit[0] : null;
}

/** Sizes in the order they should show on a product page. */
const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "3-4", "5-6", "7-8", "9-10", "11-12", "13-14", "One size"];
export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a), ib = SIZE_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
