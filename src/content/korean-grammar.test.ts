import { describe, expect, it } from "vitest";
import { curriculumModules } from "./curriculum";
import { koreanGrammarLessons } from "./korean-grammar";
import { getTeacherTip } from "./teacher-tips";
import { publicLessonContent } from "../lib/public-lesson";

describe("Korean Grammar module", () => {
  it("adds ten complete lessons and fifty main checkpoint questions as module three", () => {
    expect(curriculumModules.map(({ slug, position, lessons }) => [slug, position, lessons.length])).toEqual([
      ["hangul-foundation", 1, 10], ["everyday-korean", 2, 10], ["korean-grammar", 3, 10],
    ]);
    expect(koreanGrammarLessons.reduce((sum, lesson) => sum + lesson.questions.length, 0)).toBe(50);
    for (const lesson of koreanGrammarLessons) {
      expect(lesson.slug).toMatch(/^grammar-/);
      expect(lesson.objectives.length).toBeGreaterThanOrEqual(3);
      expect(lesson.explanation.trim().length).toBeGreaterThan(100);
      expect(lesson.examples.length).toBeGreaterThanOrEqual(3);
      expect(lesson.dialogue?.length).toBeGreaterThanOrEqual(2);
      expect(lesson.practicePrompts?.length).toBeGreaterThanOrEqual(3);
      expect(lesson.commonMistakes?.length).toBeGreaterThanOrEqual(3);
      expect(lesson.activities.length).toBeGreaterThanOrEqual(3);
      expect(lesson.vocabulary.length).toBeGreaterThanOrEqual(4);
      expect(lesson.questions).toHaveLength(5);
      for (const question of lesson.questions) {
        expect(question.options).toHaveLength(3);
        expect(question.options[question.answer]).toBeTruthy();
        expect(question.explanation.trim()).not.toBe("");
      }
      const publicContent = publicLessonContent(lesson);
      expect(publicContent.dialogue).toEqual(lesson.dialogue);
      expect(JSON.stringify(publicContent)).not.toMatch(/"(questions|answer|answer_index|correctAnswer)"/i);
    }
  });

  it("associates existing optional Teacher Tips with related grammar lessons", () => {
    expect(getTeacherTip("everyday-greetings")?.slug).toBe("everyday-greetings");
    expect(getTeacherTip("grammar-copula")?.slug).toBe("everyday-personal-information");
    expect(getTeacherTip("grammar-integrated-review")?.slug).toBe("everyday-review");
  });
});
