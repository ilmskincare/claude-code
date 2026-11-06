import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

// Use a pre-installed Chromium when present (e.g. the cloud dev container); otherwise Playwright's own.
const executablePath = process.env.PW_CHROMIUM_PATH ?? (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);

/**
 * E2E against the dev server on port 3000 using the seeded development database.
 * Sign-in uses the development outbox (no email provider): the magic link is read
 * from the check-email page, exactly as a developer would.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000", trace: "retain-on-failure", screenshot: "only-on-failure", locale: "en-GB", timezoneId: "Europe/London", launchOptions: executablePath ? { executablePath } : undefined },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "iphone", use: { ...devices["iPhone 14"], browserName: "chromium" } },
  ],
  outputDir: "test-results",
});
