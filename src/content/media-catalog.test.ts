import { describe, expect, it } from "vitest";
import { curriculumModules } from "./curriculum";
import { lessonMediaCatalog } from "./media-catalog";

describe("curated lesson media", () => {
  it("covers all 20 curriculum lessons with directly attributed verified resources", () => {
    const allLessons = curriculumModules.flatMap((module) => module.lessons);
    expect(allLessons).toHaveLength(20);
    expect(Object.keys(lessonMediaCatalog).sort()).toEqual(allLessons.map(({ slug }) => slug).sort());
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
        if (resource.kind === "video") expect(resource.url).toContain("altv.thaipbs.or.th/programs/tutor-hub/");
      }
    }
  });

  it("distinguishes public lesson videos from catalog pages and attributes the exact sources", () => {
    const resources = Object.values(lessonMediaCatalog).flat();
    expect(resources.filter((resource) => resource.creator === "KHEM KOREA").map((resource) => resource.id)).toEqual(expect.arrayContaining(["hVnDpNqWwDc", "1MMOYfIWcmM"]));
    expect(resources.filter((resource) => resource.creator === "OpenHangul").every((resource) => resource.url.includes("hangul.openblog.com/th/lesson/"))).toBe(true);
    const altvVideos = resources.filter((resource) => resource.kind === "video" && resource.creator.includes("Thai PBS ALTV"));
    expect(altvVideos).toHaveLength(4);
    expect(new Set(altvVideos.map((resource) => resource.id)).size).toBe(3);
    const thaiMooc = resources.find((resource) => resource.id === "kmooc-korean-beginner-1-syllabus");
    expect(thaiMooc?.kind).toBe("article");
    expect(thaiMooc?.summary).toContain("ปิดการลงทะเบียนแล้ว");
    expect(thaiMooc?.summary).toContain("ไม่ใช่วิดีโอบทเรียน");
    expect(resources.filter((resource) => resource.url.endsWith("Thailand%201.pdf"))).toHaveLength(7);
    expect(resources.some((resource) => resource.id === "eps-new-textbook-1" && resource.kind === "article")).toBe(true);
    expect(resources.some((resource) => resource.id === "BbLRZqnryHg")).toBe(false);
  });
});
