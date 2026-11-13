import { describe, expect, it } from "vitest";
import { curriculumModules } from "./curriculum";
import { epsPreparationLessons } from "./eps-preparation";
import { publicLessonContent } from "../lib/public-lesson";
import { recommendationsForMissedSkills } from "../lib/eps-skill-recommendations";
import { listeningItemsByLesson } from "./media-catalog";

describe("EPS-TOPIK preparation curriculum", () => {
  it("adds ten complete original lessons as module five for a 50-lesson, 250-checkpoint curriculum", () => {
    expect(curriculumModules.map((module) => [module.slug, module.position, module.lessons.length])).toEqual([
      ["hangul-foundation", 1, 10], ["everyday-korean", 2, 10], ["korean-grammar", 3, 10], ["workplace-korean", 4, 10], ["eps-topik-preparation", 5, 10],
    ]);
    expect(curriculumModules.flatMap((module) => module.lessons)).toHaveLength(50);
    expect(curriculumModules.flatMap((module) => module.lessons).reduce((sum, lesson) => sum + lesson.questions.length, 0)).toBe(250);
    for (const lesson of epsPreparationLessons) {
      expect(lesson.objectives.length, lesson.slug).toBeGreaterThanOrEqual(3);
      expect(lesson.explanation.length, lesson.slug).toBeGreaterThan(250);
      expect(lesson.examples.length, lesson.slug).toBeGreaterThanOrEqual(3);
      expect(lesson.activities.length, lesson.slug).toBeGreaterThanOrEqual(3);
      expect(lesson.vocabulary.length, lesson.slug).toBeGreaterThanOrEqual(4);
      expect(lesson.practicePrompts?.length, lesson.slug).toBeGreaterThanOrEqual(3);
      expect(lesson.commonMistakes?.length, lesson.slug).toBeGreaterThanOrEqual(3);
      expect(lesson.questions, lesson.slug).toHaveLength(5);
      expect(lesson.epsPractice?.length, lesson.slug).toBeGreaterThan(0);
      expect(listeningItemsByLesson[lesson.slug]?.length, lesson.slug).toBeGreaterThanOrEqual(3);
      for (const question of lesson.questions) {
        expect(new Set(question.options).size, `${lesson.slug}: ${question.prompt}`).toBe(3);
        expect(question.answer).toBeGreaterThanOrEqual(0);
        expect(question.answer).toBeLessThan(question.options.length);
        expect(question.explanation.trim()).not.toBe("");
      }
      const publicContent = publicLessonContent(lesson);
      expect(publicContent.epsPractice).toEqual(lesson.epsPractice);
      expect(JSON.stringify(publicContent)).not.toMatch(/"(questions|answer|answer_index|correctAnswer)"/i);
    }
  });

  it("maps simulator skill categories to relevant lessons and leaves unknown skills explicit", () => {
    const result = recommendationsForMissedSkills(["vocabulary", "grammar", "safety", "future-skill"]);
    expect(result.recommendations).toEqual([
      { skill: "grammar", lessonSlug: "eps-vocabulary-grammar-context", title: "คำศัพท์และไวยากรณ์จากบริบท" },
      { skill: "safety", lessonSlug: "eps-safety-instructions", title: "คำสั่งและข้อความความปลอดภัย" },
    ]);
    expect(result.unmapped).toEqual(["future-skill"]);
    expect(new Set(result.recommendations.map((item) => item.lessonSlug)).size).toBe(result.recommendations.length);
  });
});
