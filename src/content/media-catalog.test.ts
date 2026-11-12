import { describe, expect, it } from "vitest";
import { curriculumModules } from "./curriculum";
import { lessonMediaCatalog } from "./media-catalog";

describe("curated Hangul lesson media", () => {
  it("covers every existing Hangul lesson with directly attributed verified resources", () => {
    const allLessons = curriculumModules.flatMap((module) => module.lessons);
    expect(Object.keys(lessonMediaCatalog)).toHaveLength(allLessons.length);
    for (const lesson of allLessons) {
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
    expect(resources.filter((resource) => resource.creator === "OpenHangul").every((resource) => resource.url.includes("hangul.openblog.com/th/lesson/"))).toBe(true);
    expect(resources.filter((resource) => resource.creator === "K-MOOC / Thai MOOC")).toHaveLength(10);
    expect(resources.some((resource) => resource.id === "BbLRZqnryHg")).toBe(false);
  });
});
