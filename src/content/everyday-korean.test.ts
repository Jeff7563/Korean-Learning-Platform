import { describe, expect, it } from "vitest";
import { everydayKoreanLessons } from "./everyday-korean";

describe("Everyday Korean content integrity", () => {
  it("provides a complete beginner learning sequence for all ten lessons", () => {
    expect(everydayKoreanLessons).toHaveLength(10);
    for (const lesson of everydayKoreanLessons) {
      expect(lesson.slug).toMatch(/^everyday-/);
      expect(lesson.title.trim(), lesson.slug).not.toBe("");
      expect(lesson.explanation.trim(), lesson.slug).not.toBe("");
      expect(lesson.objectives.length, lesson.slug).toBeGreaterThanOrEqual(3);
      expect(lesson.examples.length, lesson.slug).toBeGreaterThanOrEqual(3);
      expect(lesson.vocabulary.length, lesson.slug).toBeGreaterThanOrEqual(5);
      expect(lesson.activities.length, lesson.slug).toBeGreaterThanOrEqual(3);
      expect(lesson.questions, lesson.slug).toHaveLength(5);

      for (const question of lesson.questions) {
        expect(question.prompt.trim(), lesson.slug).not.toBe("");
        expect(question.options.length, lesson.slug).toBeGreaterThanOrEqual(3);
        expect(question.options[question.answer], `${lesson.slug}: ${question.prompt}`).toBeTruthy();
        expect(question.explanation.trim(), `${lesson.slug}: ${question.prompt}`).not.toBe("");
      }
    }
  });

  it("retains key beginner distinctions in politeness, origin, and Korean number systems", () => {
    const lessons = new Map(everydayKoreanLessons.map((lesson) => [lesson.slug, lesson]));
    const greetings = lessons.get("everyday-greetings")!;
    const personalInfo = lessons.get("everyday-personal-information")!;
    const sino = lessons.get("everyday-sino-korean-numbers")!;
    const counters = lessons.get("everyday-native-numbers-counters")!;
    const dates = lessons.get("everyday-days-dates-time")!;

    expect(greetings.explanation).toContain("해요체");
    expect(greetings.explanation).toContain("합니다체");
    expect(personalInfo.explanation).toContain("태국에서 왔어요");
    expect(personalInfo.explanation).toContain("태국 사람이에요");
    expect(sino.explanation).toContain("영, 일, 이, 삼");
    expect(sino.explanation).toContain("공");
    expect(counters.explanation).toContain("한, 두, 세, 네");
    expect(dates.explanation).toContain("유월");
    expect(dates.explanation).toContain("시월");
  });
});
