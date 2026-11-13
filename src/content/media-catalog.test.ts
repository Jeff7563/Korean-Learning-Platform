import { describe, expect, it } from "vitest";
import { curriculumModules } from "./curriculum";
import { lessonMediaCatalog } from "./media-catalog";

describe("curated lesson media", () => {
  it("keeps each linked curriculum resource directly attributed and verified", () => {
    const allLessons = curriculumModules.flatMap((module) => module.lessons);
    expect(allLessons).toHaveLength(30);
    expect(Object.keys(lessonMediaCatalog).every((slug) => allLessons.some((lesson) => lesson.slug === slug))).toBe(true);
    for (const resources of Object.values(lessonMediaCatalog)) {
      for (const resource of resources) {
        expect(resource.creator).not.toBe("");
        expect(resource.title).not.toBe("");
        expect(new URL(resource.url).protocol).toBe("https:");
        expect(resource.verification.status).toBe("verified");
        expect(["2026-11-12", "2026-11-13"]).toContain(resource.verification.checkedAt);
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
    expect(resources.filter((resource) => resource.url.endsWith("Thailand%201.pdf"))).toHaveLength(8);
    expect(resources.some((resource) => resource.id === "eps-new-textbook-1" && resource.kind === "article")).toBe(true);
    expect(resources.some((resource) => resource.id === "BbLRZqnryHg")).toBe(false);
    expect(lessonMediaCatalog["grammar-present-tense"]?.[0]).toMatchObject({
      id: "xXKsp0wiYB4", title: "ไวยากรณ์ภาษาเกาหลี: 아요/어요", creator: "SEOUL HI", language: "th", kind: "youtube",
    });
  });
});
