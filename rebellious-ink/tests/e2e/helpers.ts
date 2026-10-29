import { expect, type Page, type Browser } from "@playwright/test";

/** Passwordless sign-in through the dev outbox: request link → read it from the check-email page → follow it. */
export async function signInAs(page: Page, email: string) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle"); // let React hydrate before typing (dev server compiles lazily)
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: /Email me a sign-in link/ }).click();
  await page.waitForURL(/\/login\/check-email/);
  const link = page.getByTestId("dev-magic-link");
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  await page.goto(href!);
  await page.waitForURL((u) => !u.pathname.startsWith("/login") && !u.pathname.startsWith("/api/auth"));
}

export async function newSignedInPage(browser: Browser, email: string, viewport?: { width: number; height: number }) {
  const context = await browser.newContext(viewport ? { viewport, locale: "en-GB", timezoneId: "Europe/London" } : { locale: "en-GB", timezoneId: "Europe/London" });
  const page = await context.newPage();
  await signInAs(page, email);
  return { context, page };
}
