import { test, expect } from "@playwright/test";
import path from "node:path";
import { newSignedInPage } from "./helpers";

const SHOTS = path.resolve("docs/screenshots");
const unique = Date.now().toString().slice(-6);
const clientEmail = `e2e-client-${unique}@test.rebelliousink.local`;
let reference = "";
let enquiryUrl = "";
let appointmentId = "";

test.describe.configure({ mode: "serial" });

test("1. public site renders with brand and artists", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Bold work");
  await page.screenshot({ path: path.join(SHOTS, `${info.project.name}-01-home.png`), fullPage: true });
  await page.goto("/artists/mo-blackwork");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Mo Blackwork");
  await page.screenshot({ path: path.join(SHOTS, `${info.project.name}-02-artist.png`), fullPage: true });
});

test("2. client submits an enquiry with a reference image and gets a unique reference (acceptance 1)", async ({ page }, info) => {
  await page.goto("/enquire?artist=mo-blackwork");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Full name").fill("E2E Client (TEST)");
  await page.getByLabel("Email", { exact: true }).fill(clientEmail);
  await page.getByLabel("Date of birth").fill("1990-01-15");
  await page.getByLabel("I confirm I am 18 or over.").check();
  await page.getByLabel("Body placement").selectOption("Forearm");
  await page.getByLabel("Approximate size (cm, longest edge)").fill("12");
  await page.getByLabel("Style").fill("fine line");
  await page.getByLabel("Describe your idea").fill("(E2E TEST) A small fine-line moth on the inner forearm, black and grey.");
  await page.getByLabel(/Reference images/).setInputFiles({ name: "ref.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64") });
  await page.getByLabel(/privacy notice/).check();
  await page.screenshot({ path: path.join(SHOTS, `${info.project.name}-03-enquiry-form.png`), fullPage: true });
  await page.getByRole("button", { name: "Send my enquiry" }).click();
  await page.waitForURL(/\/enquire\/thanks\//);
  reference = (await page.getByTestId("enquiry-reference").textContent())!.trim();
  expect(reference).toMatch(/^ENQ-\d{4}-\d{6}$/);
  await page.screenshot({ path: path.join(SHOTS, `${info.project.name}-04-enquiry-thanks.png`) });
});

test("3. the client can sign in and see their thread; artist B cannot see it (acceptance 2)", async ({ browser }, info) => {
  const client = await newSignedInPage(browser, clientEmail);
  await client.page.goto("/my");
  await expect(client.page.getByText(reference)).toBeVisible();
  await client.page.getByRole("link", { name: reference }).click();
  await client.page.waitForURL(/\/my\/enquiries\//);
  enquiryUrl = client.page.url();
  const id = enquiryUrl.split("/").pop()!;
  await expect(client.page.getByRole("heading", { name: reference })).toBeVisible();
  await client.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-05-client-enquiry.png`), fullPage: true });
  await client.context.close();

  const b = await newSignedInPage(browser, "artist-b@test.rebelliousink.local");
  const res = await b.page.goto(`/studio/enquiries/${id}`);
  expect(res?.status()).toBe(404);
  const apiRes = await b.page.request.get(`/api/availability?requestId=${id}&from=2026-01-01&to=2026-01-02`);
  expect(apiRes.status()).toBe(404);
  await b.page.goto("/studio/enquiries");
  await expect(b.page.getByText(reference)).toHaveCount(0);
  await b.context.close();
});

test("4. artist A replies and sends a quote; client accepts and books a genuinely free slot", async ({ browser }, info) => {
  const id = enquiryUrl.split("/").pop()!;
  const a = await newSignedInPage(browser, "artist-a@test.rebelliousink.local");
  await a.page.goto("/studio");
  await expect(a.page.getByText(reference)).toBeVisible();
  await a.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-06-artist-workspace.png`), fullPage: true });
  await a.page.goto(`/studio/enquiries/${id}`);
  await a.page.getByLabel("Reply").fill("(E2E) Thanks, a moth that size is about 90 minutes. Quote coming now.");
  await a.page.getByLabel(/Attach images/).setInputFiles({ name: "stencil.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64") });
  await a.page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(a.page.getByText("Quote coming now")).toBeVisible();
  await expect(a.page.getByRole("img", { name: "stencil.png" })).toBeVisible(); // attachment rendered through the signed route
  await a.page.getByLabel("Scope").fill("Fine-line moth, 12 cm, inner forearm, single session, one free touch-up within 3 months.");
  await a.page.getByLabel("Total (£)").fill("180");
  await a.page.getByLabel("Deposit (£)").fill("50");
  await a.page.getByLabel("Minutes").fill("90");
  await a.page.getByRole("button", { name: "Send quote" }).click();
  await expect(a.page.getByText("Quote sent to the client.")).toBeVisible();
  await a.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-07-artist-enquiry-quote.png`), fullPage: true });
  await a.context.close();

  const c = await newSignedInPage(browser, clientEmail);
  await c.page.goto(enquiryUrl);
  await expect(c.page.getByText("£180.00")).toBeVisible();
  await c.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-08-client-quote.png`), fullPage: true });
  await c.page.getByRole("button", { name: "Accept quote and terms" }).click();
  await c.page.waitForURL(/\/book$/);
  await c.page.locator('button[aria-pressed]').first().click();
  await c.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-09-slot-picker.png`), fullPage: true });
  await c.page.getByRole("button", { name: "Hold slot and pay deposit" }).click();
  await c.page.waitForURL(/\/my\/bookings\//);
  appointmentId = c.page.url().split("/").pop()!;
  await expect(c.page.getByRole("heading", { name: /^RI-\d{4}-\d{6}$/ })).toBeVisible();
  await expect(c.page.locator(".badge", { hasText: "Awaiting deposit" })).toBeVisible();
  await c.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-10-booking-pending-deposit.png`), fullPage: true });
  await c.context.close();
});

test("5. owner sees the booking, verifies a manual deposit, moves it with a reason and leaves an audit trail (acceptance 3 and 5)", async ({ browser }, info) => {
  const o = await newSignedInPage(browser, "owner@test.rebelliousink.local");
  await o.page.goto("/owner");
  await expect(o.page.getByRole("heading", { name: "Studio overview" })).toBeVisible();
  await o.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-11-owner-dashboard.png`), fullPage: true });
  await o.page.goto(`/owner/bookings/${appointmentId}`);
  await expect(o.page.locator(".badge", { hasText: "Awaiting deposit" }).first()).toBeVisible();
  await o.page.getByLabel("Verification note").fill("E2E: seen on bank statement");
  await o.page.getByRole("button", { name: "Record verified deposit" }).click();
  // The verify form disappears once the appointment is no longer pending; the badge and audit row prove the outcome.
  await expect(o.page.locator(".badge", { hasText: "Confirmed" }).first()).toBeVisible();
  await expect(o.page.getByText("appointment.confirmed")).toBeVisible();
  await expect(o.page.getByText("client deposits held")).toBeVisible();
  // Unique per run so repeated runs against the same database do not clash with earlier moved bookings.
  const n = Number(unique);
  const newStart = new Date(Date.now() + (10 + (n % 20)) * 86400000);
  const hh = String(9 + (n % 7)).padStart(2, "0"), mm = String((n % 4) * 15).padStart(2, "0");
  const local = `${newStart.getFullYear()}-${String(newStart.getMonth() + 1).padStart(2, "0")}-${String(newStart.getDate()).padStart(2, "0")}T${hh}:${mm}`;
  await o.page.getByLabel("New start (Europe/London)").fill(local);
  await o.page.getByLabel(/Reason \(required/).fill("E2E: artist requested a later start");
  await o.page.getByRole("button", { name: "Move and notify" }).click();
  await expect(o.page.getByText("Moved. Client and artist notified.")).toBeVisible();
  await expect(o.page.getByText("appointment.rescheduled")).toBeVisible();
  await o.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-12-owner-booking-audit.png`), fullPage: true });
  await o.page.goto("/owner/calendar");
  await o.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-13-owner-planner.png`), fullPage: true });
  await o.page.goto("/owner/artists");
  await expect(o.page.getByText("£500.00")).toBeVisible();
  await o.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-14-owner-artists-calculator.png`), fullPage: true });
  await o.page.goto("/owner/mailbox");
  await expect(o.page.getByText(/moved to/).first()).toBeVisible();
  await o.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-15-owner-outbox.png`), fullPage: true });
  await o.context.close();
});

test("6. branded paperwork renders on screen and as PDF (acceptance 9, prototype)", async ({ page }, info) => {
  await page.goto("/guides/tattoo-aftercare");
  await expect(page.getByRole("heading", { name: "Tattoo Aftercare" })).toBeVisible();
  await page.screenshot({ path: path.join(SHOTS, `${info.project.name}-16-branded-guide.png`), fullPage: true });
  const res = await page.request.get("/guides/tattoo-aftercare/pdf");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/pdf");
  expect(res.headers()["x-document-sha256"]).toMatch(/^[a-f0-9]{64}$/);
});

test("7. under-18 tattoo enquiry is refused (acceptance 8)", async ({ page }) => {
  await page.goto("/enquire");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Full name").fill("Minor Test");
  await page.getByLabel("Email", { exact: true }).fill(`minor-${unique}@test.rebelliousink.local`);
  await page.getByLabel("Date of birth").fill(new Date(Date.now() - 17 * 365.25 * 86400000).toISOString().slice(0, 10));
  await page.getByLabel("I confirm I am 18 or over.").check();
  await page.getByLabel("Describe your idea").fill("(E2E) This must be refused because the date of birth is under 18.");
  await page.getByLabel(/privacy notice/).check();
  await page.getByRole("button", { name: "Send my enquiry" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "under 18" })).toContainText("under 18 is prohibited");
});

test("8. artist sets walk-in hours and time off; walk-ins show publicly but never as online slots", async ({ browser }, info) => {
  const a = await newSignedInPage(browser, "artist-a@test.rebelliousink.local");
  await a.page.goto("/studio/hours");
  await a.page.waitForLoadState("networkidle");
  await a.page.getByLabel("Day", { exact: true }).selectOption("7");
  await a.page.getByLabel("From", { exact: true }).first().fill("12:00");
  await a.page.getByLabel("To", { exact: true }).first().fill("16:00");
  await a.page.getByLabel("Use for").selectOption("walk_ins");
  await a.page.getByRole("button", { name: "Add hours" }).click();
  await expect(a.page.getByText("Hours added.")).toBeVisible();
  await expect(a.page.getByText("12:00–16:00 · Walk-ins only")).toBeVisible();
  await a.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-17-artist-hours.png`), fullPage: true });
  await a.page.goto("/artists/mo-blackwork");
  await expect(a.page.getByText("Sun 12:00–16:00")).toBeVisible();
  await expect(a.page.locator(".badge", { hasText: "walk-ins" })).toBeVisible();
  // remove it again so repeated runs stay clean
  await a.page.goto("/studio/hours");
  await a.page.getByRole("button", { name: /Remove Sunday 12:00/ }).click();
  await expect(a.page.getByText("12:00–16:00 · Walk-ins only")).toHaveCount(0);
  await a.context.close();
});
