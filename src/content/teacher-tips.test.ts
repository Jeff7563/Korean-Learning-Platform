import { describe, expect, it } from "vitest";
import { curriculumModules } from "./curriculum";
import { pendingTeacherVideoUrls, teacherTips } from "./teacher-tips";

describe("optional teacher tips", () => {
  it("map only to existing lessons and contain usable original practice", () => {
    const lessonSlugs = new Set(curriculumModules.flatMap((module) => module.lessons.map((lesson) => lesson.slug)));
    expect(teacherTips.length).toBeGreaterThanOrEqual(5);
    expect(new Set(teacherTips.map((tip) => tip.slug)).size).toBe(teacherTips.length);
    expect(teacherTips.map((tip) => tip.slug)).toEqual([
      "everyday-personal-information",
      "everyday-greetings",
      "everyday-shopping-food-prices",
      "everyday-objects-sentences",
      "everyday-review",
    ]);
    for (const tip of teacherTips) {
      expect(lessonSlugs.has(tip.slug), tip.slug).toBe(true);
      for (const relatedSlug of tip.relatedLessonSlugs ?? []) expect(lessonSlugs.has(relatedSlug), relatedSlug).toBe(true);
      expect(tip.objective.trim().length).toBeGreaterThan(10);
      expect(tip.examples.length).toBeGreaterThanOrEqual(2);
      expect(tip.questions.length).toBeGreaterThanOrEqual(3);
      for (const question of tip.questions) {
        expect(question.options).toHaveLength(3);
        expect(question.answer).toBeGreaterThanOrEqual(0);
        expect(question.answer).toBeLessThan(question.options.length);
        expect(question.options[question.answer]).toBeTruthy();
        expect(question.explanation.trim().length).toBeGreaterThan(8);
      }
    }
  });

  it("keeps all five Facebook source mappings pending until metadata is verified", () => {
    expect(pendingTeacherVideoUrls).toHaveLength(5);
    expect(new Set(pendingTeacherVideoUrls).size).toBe(5);
    expect(pendingTeacherVideoUrls.every((url) => /^https:\/\/www\.facebook\.com\/reel\/\d+$/.test(url))).toBe(true);
    expect(teacherTips.every((tip) => !JSON.stringify(tip).includes("facebook.com/reel/"))).toBe(true);
  });
});
