import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { resetTestDatabase, seedMinimal, testDb } from "./helpers";
import { capabilitiesFor, type Principal } from "@/lib/rbac";
import { addPortfolioItem, listPortfolio, removePortfolioItem, setPortfolioCover, setPortfolioPublished } from "@/lib/portfolio";

let s: Awaited<ReturnType<typeof seedMinimal>>;
const principal = (userId: string, roles: Principal["roles"], artistProfileId: string | null = null): Principal => ({ userId, email: `${userId}@t`, name: "T", roles, capabilities: capabilitiesFor(roles), artistProfileId, membershipId: null, isSuspended: false });
let owner: Principal, artistA: Principal, artistB: Principal;
const png = () => new File([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64")], "work.png", { type: "image/png" });

beforeAll(async () => {
  await resetTestDatabase(); s = await seedMinimal();
  owner = principal(s.owner.id, ["OWNER"]); artistA = principal(s.artistUser.id, ["RESIDENT_ARTIST"], s.artist.id); artistB = principal(s.artistBUser.id, ["RESIDENT_ARTIST"], s.artistB.id);
});
afterAll(async () => { await testDb.$disconnect(); });

describe("portfolio uploads", () => {
  it("an artist uploads with permission and it is published and becomes the cover; without permission it stays hidden and cannot be published", async () => {
    const a = await addPortfolioItem(artistA, s.artist.id, png(), { caption: "Moth", styleTags: "Fine line, Blackwork", placement: "forearm", isHealed: true, isCover: false, permission: true });
    expect(a.publishedAt).not.toBeNull(); expect(a.isCover).toBe(true); expect(a.styleTags).toEqual(["fine line", "blackwork"]);
    const b = await addPortfolioItem(artistA, s.artist.id, png(), { caption: "Private", styleTags: "", placement: "", isHealed: false, isCover: false, permission: false });
    expect(b.publishedAt).toBeNull();
    await expect(setPortfolioPublished(artistA, b.id, true)).rejects.toThrow(/permission/);
    const list = await listPortfolio(s.artist.id);
    expect(list.map((i) => i.id)).toEqual([a.id, b.id]);
    expect(list[1].asset.permissions).toHaveLength(0); expect(list[1].asset.visibility).toBe("PORTFOLIO_PENDING");
  });
  it("another artist cannot touch it; the owner can set the cover, unpublish and remove on the artist's behalf; non-images are refused", async () => {
    const [a, b] = await listPortfolio(s.artist.id);
    await expect(setPortfolioCover(artistB, b.id)).rejects.toThrow();
    await expect(addPortfolioItem(artistB, s.artist.id, png(), { caption: "", styleTags: "", placement: "", isHealed: false, isCover: false, permission: true })).rejects.toThrow();
    await setPortfolioCover(owner, b.id);
    expect((await listPortfolio(s.artist.id)).find((i) => i.id === b.id)!.isCover).toBe(true);
    await setPortfolioPublished(owner, a.id, false);
    expect((await testDb.portfolioItem.findUniqueOrThrow({ where: { id: a.id } })).publishedAt).toBeNull();
    await setPortfolioPublished(owner, a.id, true);
    await removePortfolioItem(owner, b.id);
    expect(await testDb.portfolioItem.count({ where: { artistId: s.artist.id } })).toBe(1);
    await expect(addPortfolioItem(owner, s.artist.id, new File([Buffer.from("%PDF-1.4")], "x.pdf", { type: "application/pdf" }), { caption: "", styleTags: "", placement: "", isHealed: false, isCover: false, permission: true })).rejects.toThrow(/images/);
    expect(await testDb.auditLog.count({ where: { action: { startsWith: "portfolio." } } })).toBeGreaterThanOrEqual(6);
  });
});
