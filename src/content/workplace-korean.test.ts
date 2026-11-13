import { describe, expect, it } from "vitest";
import { curriculumModules } from "./curriculum";
import { workplaceKoreanLessons } from "./workplace-korean";
import { publicLessonContent } from "../lib/public-lesson";

describe("Workplace Korean module", () => {
  it("keeps Workplace Korean at lessons 31–40 and adds a fifth module", () => {
    expect(curriculumModules.map(({ slug, position, lessons }) => [slug, position, lessons.length])).toEqual([
      ["hangul-foundation", 1, 10],
      ["everyday-korean", 2, 10],
      ["korean-grammar", 3, 10],
      ["workplace-korean", 4, 10],
      ["eps-topik-preparation", 5, 10],
    ]);
    expect(curriculumModules.flatMap(({ lessons }) => lessons)).toHaveLength(50);
    expect(curriculumModules.flatMap(({ lessons }) => lessons).reduce((sum, lesson) => sum + lesson.questions.length, 0)).toBe(250);
    expect(workplaceKoreanLessons.map(({ slug }) => slug)).toEqual([
      "workplace-respectful-greetings", "workplace-schedules-attendance", "workplace-locations-departments",
      "workplace-tools-equipment", "workplace-instructions", "workplace-clarification",
      "workplace-quantities-measurements", "workplace-safety-signs", "workplace-reporting-problems",
      "workplace-integrated-dialogues",
    ]);
  });

  it("provides beginner-facing practice and private checkpoint answers for each new lesson", () => {
    for (const lesson of workplaceKoreanLessons) {
      expect(lesson.objectives.length).toBeGreaterThanOrEqual(3);
      expect(lesson.explanation.trim().length).toBeGreaterThan(250);
      expect(lesson.examples.length).toBeGreaterThanOrEqual(3);
      expect(lesson.dialogue?.length).toBeGreaterThanOrEqual(2);
      expect(lesson.activities.length).toBeGreaterThanOrEqual(3);
      expect(lesson.practicePrompts?.length).toBeGreaterThanOrEqual(3);
      expect(lesson.commonMistakes?.length).toBeGreaterThanOrEqual(3);
      expect(lesson.vocabulary.length).toBeGreaterThanOrEqual(4);
      expect(lesson.questions).toHaveLength(5);

      for (const question of lesson.questions) {
        expect(question.prompt).toBeTruthy();
        expect(question.options).toHaveLength(3);
        expect(new Set(question.options).size).toBe(3);
        expect(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length).toBe(true);
        expect(question.explanation.trim()).not.toBe("");
      }

      const publicContent = publicLessonContent(lesson);
      expect(publicContent.dialogue).toEqual(lesson.dialogue);
      expect(JSON.stringify(publicContent)).not.toMatch(/"(questions|answer|answer_index|correctAnswer)"/i);
    }
  });

  it("corrects particle function versus batchim form in the grammar explanation", () => {
    const particles = curriculumModules[2].lessons[0];
    expect(particles.explanation).toContain("บอกหน้าที่");
    expect(particles.commonMistakes?.join(" ")).toContain("ไวยากรณ์และบริบท");
    expect(particles.commonMistakes?.join(" ")).not.toContain("จากตัวสะกดท้ายคำนาม ไม่ใช่จากความหมาย");
    expect(particles.commonMistakes?.join(" ")).toContain("자연스러운 순서는");
    expect(particles.commonMistakes?.join(" ")).not.toContain("자연한 순서는");
  });
});
