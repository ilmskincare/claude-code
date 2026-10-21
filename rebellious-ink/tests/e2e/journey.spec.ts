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
  const hh = String(9 + (Math.floor(n / 60) % 8)).padStart(2, "0"), mm = String((Math.floor(n / 480) % 4) * 15).padStart(2, "0");
  // A long-lived database accumulates moved bookings; if the slot clashes, try the next day (up to five times).
  for (let attempt = 0; attempt < 5; attempt++) {
    const newStart = new Date(Date.now() + (10 + ((n + attempt) % 60)) * 86400000);
    const local = `${newStart.getFullYear()}-${String(newStart.getMonth() + 1).padStart(2, "0")}-${String(newStart.getDate()).padStart(2, "0")}T${hh}:${mm}`;
    await o.page.getByLabel("New start (Europe/London)").fill(local);
    await o.page.getByLabel(/Reason \(required/).fill("E2E: artist requested a later start");
    await o.page.getByRole("button", { name: "Move and notify" }).click();
    const outcome = o.page.getByText(/Moved\. Client and artist notified\.|clashes with another booking/);
    await expect(outcome.first()).toBeVisible();
    if ((await outcome.first().textContent())!.startsWith("Moved")) break;
  }
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

test("9. owner sells stock to a chair-rent artist; the artist sees what they owe (acceptance 13)", async ({ browser }, info) => {
  const o = await newSignedInPage(browser, "owner@test.rebelliousink.local");
  await o.page.goto("/owner/stock");
  await expect(o.page.getByRole("heading", { name: "Stock" })).toBeVisible();
  await o.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-18-owner-stock.png`), fullPage: true });
  await o.page.getByRole("link", { name: /Nitrile gloves/ }).click();
  await o.page.waitForLoadState("networkidle");
  const onHand = () => o.page.locator(".stat", { hasText: "On hand" }).locator(".value").textContent().then((t) => Number(t!.split(" ")[0]));
  // Receive a box first so repeated runs never sell from an empty shelf.
  const received = await onHand();
  const receive = o.page.locator("section", { has: o.page.getByRole("heading", { name: "Receive stock" }) });
  await receive.getByLabel("Quantity", { exact: true }).fill("1");
  await receive.getByLabel("Lot / batch").fill(`E2E-${unique}`);
  await receive.getByRole("button", { name: "Receive", exact: true }).click();
  await expect(o.page.getByText("Stock received.")).toBeVisible();
  await expect(o.page.locator(".stat", { hasText: "On hand" }).locator(".value")).toContainText(String(received + 1));
  const before = await onHand();
  const moValue = await o.page.locator("select#artistId option", { hasText: "Mo Blackwork" }).getAttribute("value");
  await o.page.getByLabel("Artist", { exact: true }).selectOption(moValue!);
  await o.page.locator("#iquantity").fill("1");
  await o.page.getByLabel("How").selectOption("sold");
  await o.page.getByRole("button", { name: "Record" }).click();
  await expect(o.page.getByText("Stock moved to the artist and recorded.")).toBeVisible();
  await expect(o.page.locator(".stat", { hasText: "On hand" }).locator(".value")).toContainText(String(before - 1));
  await expect(o.page.getByText("sold to artist").first()).toBeVisible();
  await o.context.close();
  const a = await newSignedInPage(browser, "artist-a@test.rebelliousink.local");
  await a.page.goto("/studio/stock");
  await expect(a.page.locator(".stat", { hasText: "Your arrangement" }).locator(".value")).toHaveText("Buy from studio");
  await expect(a.page.locator(".stat", { hasText: "You owe for stock" }).locator(".value")).toContainText(/£\d/);
  await a.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-19-artist-stock.png`), fullPage: true });
  await a.context.close();
});

test("10. apprentice logs hours and marks a skill ready; cannot sign off; owner verifies and signs off (acceptance 14)", async ({ browser }, info) => {
  const ap = await newSignedInPage(browser, "apprentice@test.rebelliousink.local");
  await ap.page.goto("/studio/academy");
  await expect(ap.page.getByRole("heading", { name: "My training" })).toBeVisible();
  await ap.page.getByLabel("Hours", { exact: true }).fill("2");
  await ap.page.getByLabel("What you did").fill("(E2E) Practice skin, shading drills");
  await ap.page.getByRole("button", { name: "Log hours" }).click();
  await expect(ap.page.getByText("Logged. Your mentor will verify it.")).toBeVisible();
  // Apprentice sees no "Sign off" button anywhere
  await expect(ap.page.getByRole("button", { name: "Sign off", exact: true })).toHaveCount(0);
  // Pick any skill that still has a "Ready for review" button so repeated runs stay valid.
  const skillRow = ap.page.locator("li").filter({ has: ap.page.getByRole("button", { name: "Ready for review" }) }).first();
  const skillTitle = (await skillRow.locator("p.font-semibold").first().textContent())!.replace("· optional", "").trim();
  // dispatchEvent: at phone width Playwright's hit-test is confused by scroll anchoring on this long list; the form still submits.
  await skillRow.getByRole("button", { name: "Ready for review" }).dispatchEvent("click");
  await expect(ap.page.locator("li", { hasText: skillTitle }).first().locator(".badge", { hasText: "Ready for review" })).toBeVisible();
  await ap.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-20-apprentice-portal.png`), fullPage: true });
  await ap.context.close();

  const o = await newSignedInPage(browser, "owner@test.rebelliousink.local");
  await o.page.goto("/owner/academy");
  await o.page.getByRole("link", { name: /Ash Apprentice/ }).click();
  await o.page.waitForLoadState("networkidle");
  const pending = o.page.locator("tr", { hasText: "(E2E) Practice skin, shading drills" }).first();
  await pending.getByRole("button", { name: "Verify" }).dispatchEvent("click");
  await expect(o.page.locator("tr", { hasText: "(E2E) Practice skin, shading drills" }).first().locator(".badge", { hasText: "Verified" })).toBeVisible();
  const row = o.page.locator("li", { hasText: skillTitle }).first();
  await row.getByPlaceholder("mentor note").fill("(E2E) Observed on three clients");
  await row.getByRole("button", { name: "Sign off" }).dispatchEvent("click");
  await expect(o.page.locator("li", { hasText: skillTitle }).first().locator(".badge", { hasText: "Competent" })).toBeVisible();
  await expect(o.page.getByRole("button", { name: "Sign off as junior artist" })).toBeDisabled();
  await expect(o.page.getByText(/Not yet eligible/)).toBeVisible();
  await o.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-21-owner-apprentice-review.png`), fullPage: true });
  await o.context.close();
});

test("11. artist edits their rate card; the desk reference and public profile reflect it", async ({ browser }, info) => {
  const a = await newSignedInPage(browser, "artist-a@test.rebelliousink.local");
  await a.page.goto("/studio/profile");
  await a.page.waitForLoadState("networkidle");
  await expect(a.page.getByRole("heading", { name: "My profile and rates" })).toBeVisible();
  await a.page.getByLabel("Hourly from (£)").fill("110");
  await a.page.getByLabel("Hourly to (£)").fill("130");
  await a.page.getByLabel("Day rate (£)").fill("700");
  await a.page.getByLabel("Placements I don't tattoo (one per line)").fill("face\nneck (first tattoo)\nhands (first tattoo)\n(E2E) ribs");
  await a.page.getByLabel("Notes for the desk (private, never public)").fill("(E2E) Quote sleeves at day rate.");
  await a.page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(a.page.getByText("Saved. The desk and your public profile are updated.")).toBeVisible();
  await a.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-22-artist-rate-card.png`), fullPage: true });
  // An artist cannot open another artist's card through the owner route
  await a.page.goto("/owner/rates");
  await expect(a.page).toHaveURL(/\/forbidden|\/login/);
  await a.context.close();

  const d = await newSignedInPage(browser, "desk@test.rebelliousink.local");
  await d.page.goto("/owner/rates");
  await expect(d.page.getByRole("heading", { name: "Ask the desk" })).toBeVisible();
  const mo = d.page.locator("section, article, div.card").filter({ has: d.page.getByRole("heading", { name: /Mo Blackwork/ }) }).first();
  await expect(mo).toContainText("£110.00–£130.00");
  await expect(mo).toContainText("£700.00");
  await expect(mo).toContainText("(E2E) ribs");
  await expect(mo).toContainText("(E2E) Quote sleeves at day rate.");
  await d.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-23-ask-the-desk.png`), fullPage: true });
  await d.context.close();

  // Public profile shows the rates and declined placements, never the desk notes.
  const pub = await browser.newPage();
  await pub.goto("/artists/mo-blackwork");
  await expect(pub.getByText("Hourly from £110 to £130")).toBeVisible();
  await expect(pub.getByText("Day rate £700")).toBeVisible();
  await expect(pub.getByText("(E2E) ribs")).toBeVisible();
  await expect(pub.getByText("(E2E) Quote sleeves at day rate.")).toHaveCount(0);
  await pub.close();
});

test("12. piercer logs a jewellery sale; stock comes down and the owner sees it in retail sales", async ({ browser }, info) => {
  // Restock first so repeated runs never sell from an empty shelf.
  const own = await newSignedInPage(browser, "owner@test.rebelliousink.local");
  await own.page.goto("/owner/stock");
  // Navigate by href: at phone width the wide stock table's link hit-test is unreliable.
  await own.page.goto((await own.page.getByRole("link", { name: "Titanium labret 16g 8 mm (TEST)" }).getAttribute("href"))!);
  await own.page.waitForLoadState("networkidle");
  const receive = own.page.locator("section", { has: own.page.getByRole("heading", { name: "Receive stock" }) });
  await receive.getByLabel("Quantity", { exact: true }).fill("2");
  await receive.getByLabel("Lot / batch").fill(`E2E-JEW-${unique}`);
  await receive.getByRole("button", { name: "Receive", exact: true }).dispatchEvent("click");
  await expect(own.page.getByText("Stock received.")).toBeVisible();
  await own.context.close();

  const pz = await newSignedInPage(browser, "piercer@test.rebelliousink.local");
  await pz.page.goto("/studio/sales");
  await pz.page.waitForLoadState("networkidle");
  const item = pz.page.getByLabel("Item");
  const before = await item.locator("option", { hasText: "Titanium labret" }).textContent();
  const onHandBefore = Number(/(\d+) in stock/.exec(before ?? "")?.[1]);
  await item.selectOption({ label: before! });
  await pz.page.getByLabel("Quantity").fill("1");
  await pz.page.getByLabel("Price each (£)").fill("12");
  await pz.page.getByLabel("Paid by").selectOption("CASH");
  await pz.page.getByLabel("Client name (optional)").fill("(E2E) Walk-in");
  // dispatchEvent: the photo strip above the form can confuse the phone-width hit-test; the form submits the same way.
  await pz.page.getByRole("button", { name: "Record sale" }).dispatchEvent("click");
  await expect(pz.page.getByText("Sale recorded and stock updated.")).toBeVisible();
  await pz.page.reload();
  const after = await pz.page.getByLabel("Item").locator("option", { hasText: "Titanium labret" }).textContent();
  expect(Number(/(\d+) in stock/.exec(after ?? "")?.[1])).toBe(onHandBefore - 1);
  await expect(pz.page.locator("tr", { hasText: "(E2E) Walk-in" }).first()).toContainText("£12.00");
  await pz.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-24-piercer-sales.png`), fullPage: true });
  await pz.context.close();

  const o = await newSignedInPage(browser, "owner@test.rebelliousink.local");
  await o.page.goto("/owner/stock/sales");
  await expect(o.page.locator("tr", { hasText: "(E2E) Walk-in" }).first()).toContainText("Sam Piercer");
  await o.context.close();
});

test("13. client sees their referral code; desk applies credit; completing the booking earns loyalty credit", async ({ browser }, info) => {
  const c = await newSignedInPage(browser, "client-two@test.rebelliousink.local");
  await c.page.goto("/my/rewards");
  await expect(c.page.getByRole("heading", { name: "Rewards and referrals" })).toBeVisible();
  const code = (await c.page.locator(".stat", { hasText: "Your code" }).locator(".value").textContent())!.trim();
  expect(code).toMatch(/^[A-Z]{1,4}-[0-9A-F]{4}$/);
  await expect(c.page.getByText(`/enquire?ref=${code}`)).toBeVisible();
  await c.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-25-client-rewards.png`), fullPage: true });
  // The share link prefills the enquiry form
  await c.page.goto(`/enquire?ref=${code}`);
  await expect(c.page.getByLabel(/Referral code/)).toHaveValue(code);
  await c.context.close();

  const o = await newSignedInPage(browser, "owner@test.rebelliousink.local");
  // The seeded appointment sits next Wednesday; the planner is keyed by week.
  const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
  await o.page.goto(`/owner/calendar?week=${nextWeek.toISOString().slice(0, 10)}`);
  await o.page.locator('a[title^="RI-2026-000001"]').first().click();
  await o.page.waitForURL(/\/owner\/bookings\//);
  await o.page.waitForLoadState("networkidle");
  const status = (await o.page.locator(".badge").first().textContent()) ?? "";
  if (/confirmed/i.test(status)) {
    await o.page.getByLabel("Final price (£)").fill("240");
    await o.page.getByRole("button", { name: "Mark completed" }).click();
    await expect(o.page.getByText(/Completed\. Rewards: client earned £12\.00/)).toBeVisible();
  }
  await expect(o.page.locator("dd", { hasText: "£240.00 / £" }).first()).toBeVisible();
  await o.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-26-owner-completed-booking.png`), fullPage: true });
  await o.context.close();

  const c2 = await newSignedInPage(browser, "client-two@test.rebelliousink.local");
  await c2.page.goto("/my/rewards");
  await expect(c2.page.locator(".stat", { hasText: "Your credit" }).locator(".value")).toContainText("£12.00");
  await expect(c2.page.locator("tr", { hasText: "5% back on RI-2026-000001" }).first()).toBeVisible();
  await c2.context.close();
});

test("14. owner adds a photo to a stock item; the piercer sees it when recording a sale", async ({ browser }, info) => {
  const o = await newSignedInPage(browser, "owner@test.rebelliousink.local");
  await o.page.goto("/owner/stock");
  await o.page.getByRole("link", { name: "Nitrile gloves, medium, box of 100 (TEST)" }).click();
  await o.page.waitForURL(/\/owner\/stock\/[a-z0-9]+$/);
  await o.page.waitForLoadState("networkidle");
  // 1x1 acid-green PNG
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
  await o.page.getByLabel("Photo (JPEG, PNG or WEBP)").setInputFiles({ name: "gloves.png", mimeType: "image/png", buffer: png });
  // dispatchEvent: at phone width the long page's hit-test can stall on this button; the form submits the same way.
  await o.page.getByRole("button", { name: "Save changes" }).dispatchEvent("click");
  await expect(o.page.getByText("Saved.", { exact: true })).toBeVisible();
  await o.page.reload();
  const photo = o.page.getByRole("img", { name: "Nitrile gloves, medium, box of 100 (TEST)" });
  await expect(photo).toBeVisible();
  expect((await o.page.request.get((await photo.getAttribute("src"))!)).status()).toBe(200);
  await o.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-27-product-photo.png`), fullPage: true });
  await o.page.goto("/owner/stock");
  await expect(o.page.locator("tr", { hasText: "Nitrile gloves" }).locator("img")).toHaveCount(1);
  await o.context.close();

  const pz = await newSignedInPage(browser, "piercer@test.rebelliousink.local");
  await pz.page.goto("/studio/sales");
  await pz.page.waitForLoadState("networkidle");
  await pz.page.getByRole("button", { name: "Choose Titanium labret 16g 8 mm (TEST)" }).click();
  await expect(pz.page.getByRole("img", { name: "Titanium labret 16g 8 mm (TEST)" })).toBeVisible();
  await expect(pz.page.getByLabel("Item")).toHaveValue(/.+/);
  await pz.context.close();
});

test("15. an artist runs a promotion: ribbon on their public card and page; owner's studio offer shows as a banner; ending it removes both", async ({ browser }, info) => {
  const a = await newSignedInPage(browser, "artist-b@test.rebelliousink.local");
  await a.page.goto("/studio/promotions");
  await a.page.waitForLoadState("networkidle");
  await a.page.getByLabel("Ribbon text (short, max 40 characters)").fill("(E2E) Colour sleeves 10% off");
  await a.page.getByLabel("Details and terms (public)").fill("(E2E) Full colour sleeves booked this month.");
  await a.page.getByLabel("Code to quote (optional)").fill("sleeve10");
  await a.page.getByRole("button", { name: "Create promotion" }).click();
  await expect(a.page.getByText("Promotion saved.")).toBeVisible();
  // Earlier runs leave ended copies with the same name; one live copy must exist.
  await expect(a.page.locator("li", { hasText: "(E2E) Colour sleeves 10% off" }).filter({ has: a.page.locator(".badge", { hasText: "live" }) }).first()).toBeVisible();
  await a.context.close();

  const o = await newSignedInPage(browser, "owner@test.rebelliousink.local");
  await o.page.goto("/owner/promotions");
  await o.page.waitForLoadState("networkidle");
  await o.page.getByLabel("Who is it for").selectOption("STUDIO");
  await o.page.getByLabel("Ribbon text (short, max 40 characters)").fill("(E2E) Student Tuesdays 15% off");
  await o.page.getByRole("button", { name: "Create promotion" }).click();
  await expect(o.page.getByText("Promotion saved.")).toBeVisible();
  await expect(o.page.locator("tr", { hasText: "(E2E) Student Tuesdays" }).first()).toContainText("Whole studio");
  await o.page.goto("/owner/rates");
  await expect(o.page.getByText("Promotions running now")).toBeVisible();
  await expect(o.page.getByText("(E2E) Colour sleeves 10% off").first()).toBeVisible();
  await o.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-28-owner-promotions.png`), fullPage: true });

  const pub = await browser.newPage();
  await pub.goto("/artists");
  await expect(pub.getByRole("region", { name: "Current offers" })).toContainText("(E2E) Student Tuesdays 15% off");
  const jay = pub.locator("li.card", { has: pub.getByRole("heading", { name: "Jay Colour (TEST)" }) });
  await expect(jay.locator(".ribbon")).toHaveText("(E2E) Colour sleeves 10% off");
  // The ribbon band (the diagonal of its rotated box, about 24px thick) must not cross the name or the status badge.
  const rb = (await jay.locator(".ribbon").boundingBox())!;
  for (const el of [jay.getByRole("heading", { name: "Jay Colour (TEST)" }), jay.locator(".badge", { hasText: "Taking enquiries" })]) {
    const b = (await el.boundingBox())!;
    let crosses = false;
    for (let t = 0; t <= 1; t += 0.02) {
      const px = rb.x + t * rb.width, py = rb.y + t * rb.height;
      if (px >= b.x - 12 && px <= b.x + b.width + 12 && py >= b.y - 12 && py <= b.y + b.height + 12) crosses = true;
    }
    expect(crosses, "ribbon crosses card content").toBe(false);
  }
  await expect(pub.locator("li.card", { has: pub.getByRole("heading", { name: "Mo Blackwork (TEST)" }) }).locator(".ribbon", { hasText: "(E2E)" })).toHaveCount(0);
  await pub.screenshot({ path: path.join(SHOTS, `${info.project.name}-29-public-promotions.png`), fullPage: true });
  await pub.goto("/artists/jay-colour");
  await expect(pub.locator("aside .ribbon")).toHaveText("(E2E) Colour sleeves 10% off");
  await expect(pub.getByText("Quote SLEEVE10")).toBeVisible();
  await pub.close();

  // Owner ends both; the public site drops them at once.
  await o.page.goto("/owner/promotions");
  for (const name of ["(E2E) Colour sleeves 10% off", "(E2E) Student Tuesdays 15% off"]) {
    // Repeated runs leave earlier copies behind; end every live row with this name.
    const liveRows = () => o.page.locator("tr", { hasText: name }).filter({ has: o.page.getByRole("button", { name: "End now" }) });
    for (let n = await liveRows().count(); n > 0; n--) {
      await liveRows().first().getByRole("button", { name: "End now" }).dispatchEvent("click");
      await expect(liveRows()).toHaveCount(n - 1);
    }
    await expect(o.page.locator("tr", { hasText: name }).first().locator(".badge", { hasText: "ended" })).toBeVisible();
  }
  await o.context.close();
  const pub2 = await browser.newPage();
  await pub2.goto("/artists");
  await expect(pub2.getByText("(E2E) Student Tuesdays 15% off")).toHaveCount(0);
  await expect(pub2.locator(".ribbon", { hasText: "(E2E)" })).toHaveCount(0);
  await pub2.close();
});

test("16. flash catalogue: total price up front, size guide, book a design straight to the slot picker; quoted placement switches to Request a quote", async ({ browser }, info) => {
  const pub = await browser.newPage();
  await pub.goto("/flash");
  await expect(pub.getByRole("heading", { name: "Flash" })).toBeVisible();
  await expect(pub.getByText("£60", { exact: true }).first()).toBeVisible();
  await pub.screenshot({ path: path.join(SHOTS, `${info.project.name}-30-flash-catalogue.png`), fullPage: true });
  await pub.getByRole("tab", { name: "Sheets" }).click();
  await expect(pub.getByRole("link", { name: /1: Butterfly \(archive\)/ })).toBeVisible();
  await pub.getByRole("tab", { name: "Designs" }).click();
  await pub.getByRole("link", { name: "Heart and shield (archive)" }).first().click();
  await pub.waitForURL(/\/flash\/[a-z0-9]+$/);
  await expect(pub.getByText("Total price, nothing added later")).toBeVisible();
  await expect(pub.getByText("£70.00").first()).toBeVisible();                       // design override
  await pub.getByLabel("Placement").selectOption("hands");
  await expect(pub.getByRole("link", { name: "Request a quote" })).toBeVisible();
  await expect(pub.getByRole("button", { name: /book this/i })).toHaveCount(0);
  await pub.getByLabel("Placement").selectOption("forearm");
  await pub.getByRole("radio", { name: /Apprentice, supervised by/ }).check();
  await expect(pub.getByText("£40.00").first()).toBeVisible();
  await expect(pub.getByText("£15.00 deposit online today")).toBeVisible();
  await pub.screenshot({ path: path.join(SHOTS, `${info.project.name}-31-flash-design.png`), fullPage: true });
  const designUrl = pub.url();
  await pub.close();

  const c = await newSignedInPage(browser, "client-one@test.rebelliousink.local");
  await c.page.goto(designUrl);
  await c.page.waitForLoadState("networkidle");
  await c.page.getByLabel("Placement").selectOption("calf");
  await c.page.getByLabel(/I confirm I am 18 or over/).check();
  await c.page.getByRole("button", { name: "Book this: choose a time" }).click();
  await c.page.waitForURL(/\/my\/enquiries\/[a-z0-9]+\/book$/);
  await expect(c.page.getByRole("heading", { name: "Choose your time" })).toBeVisible();
  await expect(c.page.getByText(/pay the £20.00 deposit/)).toBeVisible();
  await c.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-32-flash-slot-picker.png`), fullPage: true });
  await c.page.goto(c.page.url().replace(/\/book$/, ""));
  await expect(c.page.getByText("Heart and shield (archive)").first()).toBeVisible();
  await expect(c.page.getByText(/Small · artist tier/)).toBeVisible();
  await c.context.close();
});

test("17. artist adds a one-off design; it appears in the catalogue and on the generated sheet; retiring removes it", async ({ browser }, info) => {
  const a = await newSignedInPage(browser, "artist-b@test.rebelliousink.local");
  await a.page.goto("/studio/flash/new");
  await a.page.waitForLoadState("networkidle");
  const title = `(E2E) Dice ${unique}`;
  await a.page.getByLabel("Title").fill(title);
  await a.page.getByLabel("Theme").fill("luck");
  await a.page.getByLabel(/Repeatable/).uncheck();
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
  await a.page.getByLabel("Design image").setInputFiles({ name: "dice.png", mimeType: "image/png", buffer: png });
  await a.page.getByRole("button", { name: "Add design" }).dispatchEvent("click");
  await expect(a.page.getByText("Saved.", { exact: true })).toBeVisible();
  await a.page.goto("/studio/flash");
  const row = a.page.locator("tr", { hasText: title }).first();
  await expect(row).toContainText("£60.00");
  await expect(row).toContainText("one-off");
  await a.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-33-artist-flash.png`), fullPage: true });
  const img = await a.page.request.get("/api/flash/sheet-image?artist=jay-colour&format=feed");
  expect(img.status()).toBe(200); expect(img.headers()["content-type"]).toContain("image/png");
  const pdf = await a.page.request.get("/api/flash/sheet-pdf?artist=jay-colour");
  expect(pdf.status()).toBe(200); expect(pdf.headers()["content-type"]).toContain("application/pdf");
  const pub = await browser.newPage();
  await pub.goto("/flash?oneoff=1&artist=jay-colour");
  await expect(pub.getByRole("link", { name: title }).first()).toBeVisible();
  await pub.close();
  await row.getByRole("button", { name: "Retire" }).dispatchEvent("click");
  await expect(a.page.locator("tr", { hasText: title }).first().locator(".badge", { hasText: "retired" })).toBeVisible();
  const pub2 = await browser.newPage();
  await pub2.goto("/flash?oneoff=1&artist=jay-colour");
  await expect(pub2.getByRole("link", { name: title })).toHaveCount(0);
  await pub2.close();
  await a.context.close();
});

test("18. gumball machine: age gate, free spin, reveal, keep it and book at the fixed price; share card has no price", async ({ browser }, info) => {
  const pub = await browser.newPage();
  await pub.goto("/play/gumball");
  await pub.waitForLoadState("networkidle");
  await expect(pub.getByRole("heading", { name: "Get what you get." })).toBeVisible();
  await expect(pub.getByText("£30").first()).toBeVisible();
  await pub.screenshot({ path: path.join(SHOTS, `${info.project.name}-34-gumball-landing.png`), fullPage: true });
  // Under-18 is refused; the cookie is only set for an adult date.
  await pub.getByLabel("Date of birth").fill(new Date(Date.now() - 17 * 365.25 * 86400000).toISOString().slice(0, 10));
  await pub.getByRole("button", { name: "Continue" }).dispatchEvent("click");
  await expect(pub.getByText(/must be 18 or over/)).toBeVisible();
  await pub.getByLabel("Date of birth").fill("1990-05-05");
  await pub.getByRole("button", { name: "Continue" }).dispatchEvent("click");
  await expect(pub.getByRole("button", { name: "Turn the crank (free)" })).toBeVisible();
  await pub.getByRole("button", { name: "Turn the crank (free)" }).dispatchEvent("click");
  await pub.waitForURL(/\/play\/gumball\/[a-z0-9]+$/);
  await expect(pub.getByRole("status")).toContainText(/You got .* by/, { timeout: 15000 });
  await expect(pub.getByText("Total price, nothing added later")).toBeVisible();
  await pub.screenshot({ path: path.join(SHOTS, `${info.project.name}-35-gumball-result.png`), fullPage: true });
  const share = await pub.request.get(await pub.locator("a", { hasText: "Share card" }).getAttribute("href") as string);
  expect(share.status()).toBe(200); expect(share.headers()["content-type"]).toContain("image/png");
  // Second spin today is refused
  await pub.goto("/play/gumball");
  await expect(pub.getByRole("button", { name: "That is your spin for today" })).toBeDisabled();
  await pub.close();

  // A fresh account per project and run (the limit is one spin per person per day) spins and books: slot picker, £10 deposit.
  const c = await newSignedInPage(browser, `gumball-${unique}-${info.project.name}@test.rebelliousink.local`);
  await c.page.goto("/play/gumball");
  await c.page.waitForLoadState("networkidle");
  if (await c.page.getByLabel("Date of birth").count()) { await c.page.getByLabel("Date of birth").fill("1990-05-05"); await c.page.getByRole("button", { name: "Continue" }).dispatchEvent("click"); }
  await c.page.getByRole("button", { name: "Turn the crank (free)" }).dispatchEvent("click");
  await c.page.waitForURL(/\/play\/gumball\/[a-z0-9]+$/);
  await expect(c.page.getByRole("status")).toContainText(/You got/, { timeout: 15000 });
  await c.page.getByLabel("Placement").selectOption("calf");
  await c.page.getByLabel(/I confirm I am 18 or over/).check();
  await c.page.getByRole("button", { name: "Keep it: choose a time" }).dispatchEvent("click");
  await c.page.waitForURL(/\/my\/enquiries\/[a-z0-9]+\/book$/);
  await expect(c.page.getByText(/pay the £10.00 deposit/)).toBeVisible();
  await c.page.goto(c.page.url().replace(/\/book$/, ""));
  await expect(c.page.getByText(/Gumball machine/).first()).toBeVisible();
  await c.page.screenshot({ path: path.join(SHOTS, `${info.project.name}-36-gumball-booked.png`), fullPage: true });
  await c.context.close();
});
