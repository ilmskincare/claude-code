import { expect, test } from "@playwright/test";

/**
 * Smoke test against the dev server with the seeded database:
 * home, shop, product page, add to cart, cart page, admin sign-in.
 * ADMIN_INITIAL_PASSWORD comes from .env (loaded in playwright.config.ts).
 */
test.describe("storefront", () => {
  test("home, shop, product and cart", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Rebellious Hustler/);
    await expect(page.getByRole("heading", { level: 1, name: "Rebellious Hustler" })).toBeVisible();
    await expect(page.getByText("ONE BRAND - ONE VOICE - ONE COMMUNITY")).toBeVisible();
    await expect(page.getByTestId("product-card").first()).toBeVisible();

    // No horizontal overflow at any tested width.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    await page.goto("/shop?audience=mens&sort=price-asc");
    await expect(page.getByRole("heading", { level: 1, name: "Mens" })).toBeVisible();
    const cards = page.getByTestId("product-card");
    expect(await cards.count()).toBeGreaterThan(0);

    await page.goto("/shop/script-tee");
    await expect(page.getByRole("heading", { level: 1, name: "Script Tee" })).toBeVisible();
    await expect(page.getByTestId("product-price")).toHaveText("£24.99");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(page.getByRole("status")).toContainText("Added to your cart");
    await expect(page.getByTestId("cart-count")).toHaveText("1");

    await page.goto("/cart");
    await expect(page.getByTestId("cart-line")).toHaveCount(1);
    await expect(page.getByTestId("cart-subtotal")).toHaveText("£24.99");
    await expect(page.getByText(/Checkout securely|Online checkout is being connected/)).toBeVisible();
  });

  test("legal pages and sitemap respond", async ({ page, request }) => {
    for (const path of ["/about", "/contact", "/delivery", "/returns", "/terms", "/privacy"]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
    }
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain("/shop/script-tee");
    const robots = await request.get("/robots.txt");
    expect(await robots.text()).toContain("Disallow: /admin");
    const manifest = await request.get("/manifest.webmanifest");
    expect(manifest.status()).toBe(200);
    const missing = await page.goto("/shop/does-not-exist");
    expect(missing?.status()).toBe(404);
  });
});

test.describe("admin", () => {
  test("redirects anonymous visitors and signs the seeded admin in", async ({ page }) => {
    await page.goto("/admin/products");
    await expect(page).toHaveURL(/\/admin\/login/);

    const password = process.env.ADMIN_INITIAL_PASSWORD;
    test.skip(!password, "ADMIN_INITIAL_PASSWORD is not set in .env");
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Username").fill("hustler");
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();
    // The seeded admin must change the starting password, or lands on the dashboard once it has.
    await expect(page).toHaveURL(/\/admin(\/password)?(\?.*)?$/);
    await expect(page.getByRole("heading", { level: 1, name: /Change your password|Dashboard/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  });
});
