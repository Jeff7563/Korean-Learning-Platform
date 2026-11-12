import { describe, expect, it } from "vitest";
import { lessons } from "./curriculum";
import { lessonMediaCatalog } from "./media-catalog";

describe("curated Hangul lesson media", () => {
  it("covers every existing Hangul lesson with directly attributed verified resources", () => {
    expect(Object.keys(lessonMediaCatalog)).toHaveLength(lessons.length);
    for (const lesson of lessons) {
      const resources = lessonMediaCatalog[lesson.slug];
      expect(resources, `${lesson.slug} should have learning resources`).toBeDefined();
      expect(resources.length).toBeGreaterThan(0);
      for (const resource of resources) {
        expect(resource.creator).not.toBe("");
        expect(resource.title).not.toBe("");
        expect(new URL(resource.url).protocol).toBe("https:");
        expect(resource.verification.status).toBe("verified");
        expect(resource.verification.checkedAt).toBe("2026-11-12");
        if (resource.kind === "youtube") expect(resource.url).toContain(`v=${resource.id}`);
      }
    }
  });

  it("keeps instructional pages labeled as articles and gives the two confirmed KHEM videos exact attribution", () => {
    const resources = Object.values(lessonMediaCatalog).flat();
    expect(resources.filter((resource) => resource.creator === "KHEM KOREA").map((resource) => resource.id)).toEqual(expect.arrayContaining(["hVnDpNqWwDc", "1MMOYfIWcmM"]));
    expect(resources.filter((resource) => resource.kind === "article").every((resource) => resource.url.includes("hangul.openblog.com/th/lesson/"))).toBe(true);
    expect(resources.some((resource) => resource.id === "BbLRZqnryHg")).toBe(false);
  });
});
