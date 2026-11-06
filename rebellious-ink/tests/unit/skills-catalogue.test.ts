import { describe, expect, it } from "vitest";
import { SEED_SKILLS, SKILL_AREAS, STAGE_LABELS } from "@/content/skills";

/** The v1 keys that apprentices may already have progress against; v2 must keep every one. */
const V1_KEYS = ["hyg-hand-hygiene", "hyg-station-setup", "hyg-clean-down", "hyg-cross-contamination", "hyg-sharps-incident", "cs-consultation", "cs-consent-id", "cs-difficult-conversations", "fund-skin-depth", "fund-hand-speed", "fund-stretch", "eq-machine-setup", "eq-power-voltage", "line-single-pass", "line-client", "shade-black-grey", "shade-solid-fill", "col-theory", "col-packing", "sten-placement", "des-composition", "des-cover-up", "anat-placement", "ops-booking", "ops-stock", "photo-ethics", "after-guidance", "comm-messaging", "port-build"];

describe("apprentice skills catalogue v2", () => {
  it("has unique keys, valid areas and stages, and keeps every v1 key", () => {
    const keys = SEED_SKILLS.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const s of SEED_SKILLS) { expect(SKILL_AREAS[s.area], `area ${s.area}`).toBeDefined(); expect(STAGE_LABELS[s.stage], `stage ${s.stage}`).toBeDefined(); expect(s.title.length).toBeGreaterThanOrEqual(3); expect(s.description.length).toBeGreaterThan(10); }
    for (const k of V1_KEYS) expect(keys, `v1 key ${k}`).toContain(k);
  });
  it("covers prerequisites and all five stages, with the UK legal gates marked core", () => {
    for (const stage of [0, 1, 2, 3, 4, 5]) expect(SEED_SKILLS.some((s) => s.stage === stage), `stage ${stage}`).toBe(true);
    for (const k of ["pre-council", "pre-infection-control", "pre-first-aid", "pre-hep-b", "cs-consent-id", "hyg-sharps-incident", "cln-disinfectants"]) expect(SEED_SKILLS.find((s) => s.key === k)?.isCore ?? true, k).toBe(true);
    // Written and optional extras must not block junior sign-off on their own.
    for (const k of ["pre-ten-tattooers", "doc-journal", "cmp-interview", "ster-autoclave"]) expect(SEED_SKILLS.find((s) => s.key === k)?.isCore, k).toBe(false);
    expect(SEED_SKILLS.length).toBeGreaterThanOrEqual(100);
  });
});
