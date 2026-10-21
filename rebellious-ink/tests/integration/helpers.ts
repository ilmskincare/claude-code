import { execSync } from "node:child_process";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export const testDb = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

/** Applies migrations to the test database and wipes volatile tables. */
export async function resetTestDatabase() {
  execSync("npx prisma migrate deploy", { stdio: "ignore", env: { ...process.env } });
  await testDb.$executeRawUnsafe(`TRUNCATE "Design", "FlashSheet", "Promotion", "SocialPost", "MarketingCampaign", "RetailSale", "PriceListItem", "LoyaltyTransaction", "Referral", "LoyaltyAccount", "PrivacyPreference", "restricted"."HealthAccessLog", "restricted"."ClientHealthRecord", "JuniorArtistSignoff", "ApprenticeEvidence", "PracticeLog", "SkillProgress", "Skill", "StockMovement", "SessionConsumable", "InventoryLot", "Product", "Supplier", "Invitation", "AuditLog", "Notification", "DevMailbox", "WebhookEvent", "Signature", "ConsentResponse", "Refund", "PaymentAllocation", "Payment", "Cancellation", "SessionLog", "GeneratedPDF", "Appointment", "BookingHold", "Quote", "Message", "Conversation", "EnquiryStatusEvent", "ImageAsset", "BookingRequest", "BookingReferenceCounter", "Leave", "AvailabilityRule", "CompensationModel", "PortfolioItem", "ArtistProfile", "Membership", "Session", "Account", "ClientProfile", "User", "Station", "StudioSetting", "LegalEntity", "Studio" CASCADE`);
}

export async function seedMinimal() {
  const studio = await testDb.studio.create({ data: { name: "Test Studio", tradingName: "Test", slug: "test" } });
  const station = await testDb.station.create({ data: { studioId: studio.id, name: "S1" } });
  const owner = await testDb.user.create({ data: { email: "owner@test.local", name: "Owner", memberships: { create: { studioId: studio.id, roles: ["OWNER"] } } } });
  const artistUser = await testDb.user.create({ data: { email: "a@test.local", name: "Artist A", memberships: { create: { studioId: studio.id, roles: ["RESIDENT_ARTIST"] } } } });
  const artistBUser = await testDb.user.create({ data: { email: "b@test.local", name: "Artist B", memberships: { create: { studioId: studio.id, roles: ["RESIDENT_ARTIST"] } } } });
  const artist = await testDb.artistProfile.create({ data: { userId: artistUser.id, slug: "a", displayName: "Artist A", isPublished: true, defaultStationId: station.id, availabilityRules: { createMany: { data: [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({ weekday, startMinute: 540, endMinute: 1080 })) } } } });
  const artistB = await testDb.artistProfile.create({ data: { userId: artistBUser.id, slug: "b", displayName: "Artist B", isPublished: true } });
  const c1 = await testDb.user.create({ data: { email: "c1@test.local", name: "Client One" } });
  const c2 = await testDb.user.create({ data: { email: "c2@test.local", name: "Client Two" } });
  return { studio, station, owner, artistUser, artist, artistB, artistBUser, c1, c2 };
}

export async function acceptedEnquiry(studioId: string, clientId: string, artistId: string, issuedById: string, ref: string) {
  return testDb.bookingRequest.create({ data: { reference: ref, studioId, clientId, artistId, category: "TATTOO", status: "AWAITING_DEPOSIT", description: "test", declaredOver18: true, conversation: { create: {} }, quotes: { create: { artistId, issuedById, status: "ACCEPTED", scope: "test", priceBasis: "fixed", amountPence: 20000, depositPence: 5000, estimatedMinutes: 90, termsVersion: "v1", termsText: "t" } } } });
}
