import { expect, test } from "@playwright/test";

test("invalid checkpoint answers are rejected without recording an attempt or changing progress", async ({ request }) => {
  const lessonResponse = await request.get("/api/lessons/hangul-intro");
  expect(lessonResponse.ok()).toBeTruthy();
  const lesson = await lessonResponse.json();
  const beforeAttempts = lesson.attempts.length;
  const courseBefore = await (await request.get("/api/courses")).json();
  const baseAnswers = lesson.exercises.map((exercise: { id: number }) => ({ exerciseId: exercise.id, selectedIndex: 0 }));
  const lastExercise = lesson.exercises.at(-1) as { id: number; options: string[] };

  const invalidPayloads = [
    { slug: "hangul-intro", answers: baseAnswers.map((answer: { exerciseId: number; selectedIndex: number }, index: number) => index === baseAnswers.length - 1 ? { ...answer, selectedIndex: lastExercise.options.length } : answer) },
    { slug: "hangul-intro", answers: baseAnswers.map((answer: { exerciseId: number; selectedIndex: number }, index: number) => index === baseAnswers.length - 1 ? { ...answer, exerciseId: baseAnswers[0].exerciseId + 5 } : answer) },
    { slug: "hangul-intro", answers: [...baseAnswers.slice(0, -1), { ...baseAnswers[0] }] },
    { slug: "hangul-intro", answers: baseAnswers.slice(0, -1) },
  ];

  for (const data of invalidPayloads) {
    const response = await request.post("/api/checkpoints", { data });
    expect(response.status()).toBe(400);
  }

  const afterLesson = await (await request.get("/api/lessons/hangul-intro")).json();
  const courseAfter = await (await request.get("/api/courses")).json();
  expect(afterLesson.attempts).toHaveLength(beforeAttempts);
  expect(courseAfter.lessons.map((item: { slug: string; status: string }) => [item.slug, item.status]))
    .toEqual(courseBefore.lessons.map((item: { slug: string; status: string }) => [item.slug, item.status]));
});
