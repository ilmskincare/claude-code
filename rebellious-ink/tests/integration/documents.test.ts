import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { resetTestDatabase, seedMinimal, testDb } from "./helpers";
import { capabilitiesFor, type Principal } from "@/lib/rbac";
import { approveDocument, withdrawDocumentApproval, listDocumentTemplates } from "@/lib/documents";

let s: Awaited<ReturnType<typeof seedMinimal>>;
const principal = (userId: string, roles: Principal["roles"]): Principal => ({ userId, email: `${userId}@t`, name: "Elle", roles, capabilities: capabilitiesFor(roles), artistProfileId: null, membershipId: null, isSuspended: false });
let owner: Principal, artist: Principal, docId: string;

beforeAll(async () => {
  await resetTestDatabase(); s = await seedMinimal();
  owner = principal(s.owner.id, ["OWNER"]); artist = principal(s.artistUser.id, ["RESIDENT_ARTIST"]);
  const d = await testDb.documentTemplateVersion.create({ data: { templateKey: "test-guide", version: 1, kind: "AFTERCARE_GUIDE", title: "Test guide", procedureType: "tattoo", bodyMarkdown: "Wash it.\n\n> Practitioner to confirm: how often.\n", ownerName: "Studio owner", issueDate: new Date(), reviewDate: new Date(), isCurrent: true } });
  docId = d.id;
});
afterAll(async () => { await testDb.$disconnect(); });

describe("document sign-off", () => {
  it("starts as a draft, counts the practitioner notes, is approved by the owner with a name and audited, and can be withdrawn", async () => {
    const before = (await listDocumentTemplates()).find((d) => d.id === docId)!;
    expect(before.approvedAt).toBeNull(); expect(before.toConfirm).toBe(1);
    await expect(approveDocument(artist, docId, "Artist")).rejects.toThrow();
    await expect(approveDocument(owner, docId, "")).rejects.toThrow(/name/);
    await approveDocument(owner, docId, "Elle Evaa");
    const after = await testDb.documentTemplateVersion.findUniqueOrThrow({ where: { id: docId } });
    expect(after.approvedAt).not.toBeNull(); expect(after.approverName).toBe("Elle Evaa");
    await expect(approveDocument(owner, docId, "Elle Evaa")).rejects.toThrow(/Already/);
    await withdrawDocumentApproval(owner, docId, "typo");
    expect((await testDb.documentTemplateVersion.findUniqueOrThrow({ where: { id: docId } })).approvedAt).toBeNull();
    expect(await testDb.auditLog.count({ where: { entityId: docId, action: { in: ["document.approved", "document.approval_withdrawn"] } } })).toBe(2);
  });
});
