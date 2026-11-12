import { expect, test } from "@playwright/test";

test("daily plans, modes, and actual study time persist independently from course progress", async ({ request }) => {
  const date = "2030-01-07"; // Monday, selected as a future date so the case is stable on every run.
  const beforeProgress = await (await request.get("/api/courses")).json();
  const initialResponse = await request.get(`/api/daily-plan?date=${date}`);
  expect(initialResponse.ok()).toBeTruthy();
  const initial = await initialResponse.json();
  expect(initial.mode).toBe("standard");
  expect(initial.plannedMinutes).toBe(90);
  expect(initial.tasks.map((task: { startsAt: string; endsAt: string }) => [task.startsAt, task.endsAt])).toEqual([["18:00","18:15"],["18:15","18:45"],["18:45","19:00"],["19:00","19:15"],["19:15","19:25"],["19:25","19:30"]]);

  expect((await request.post("/api/daily-plan", { data: { action: "mode", date, mode: "light" } })).ok()).toBeTruthy();
  const light = await (await request.get(`/api/daily-plan?date=${date}`)).json();
  expect(light.mode).toBe("light");
  expect(light.tasks).toHaveLength(3);
  expect(light.plannedMinutes).toBe(15);
  const task = light.tasks[0];
  expect((await request.post("/api/daily-plan", { data: { action: "task", date, taskId: task.id, completed: true } })).ok()).toBeTruthy();
  expect((await request.post("/api/daily-plan", { data: { action: "mode", date, mode: "standard" } })).status()).toBe(409);

  for (const remaining of light.tasks.slice(1)) expect((await request.post("/api/daily-plan", { data: { action: "task", date, taskId: remaining.id, completed: true } })).ok()).toBeTruthy();
  expect((await request.post("/api/daily-plan", { data: { action: "time", date, minutes: 7 } })).ok()).toBeTruthy();
  const completed = await (await request.get(`/api/daily-plan?date=${date}`)).json();
  expect(completed.completionPercent).toBe(100);
  expect(completed.actualMinutes).toBe(7);
  expect(completed.tasks.every((item: { completedAt: string | null }) => item.completedAt)).toBe(true);
  expect((await request.post("/api/daily-plan", { data: { action: "mode", date, mode: "standard" } })).status()).toBe(409);

  const afterProgress = await (await request.get("/api/courses")).json();
  expect(afterProgress).toEqual(beforeProgress);
  const repeated = await (await request.get(`/api/daily-plan?date=${date}`)).json();
  expect(repeated.tasks).toHaveLength(3);
  expect(repeated.actualMinutes).toBe(7);
});

test("Sunday defaults to rest with an optional activity and no required checklist", async ({ request }) => {
  const plan = await (await request.get("/api/daily-plan?date=2030-01-06")).json();
  expect(plan.mode).toBe("rest");
  expect(plan.plannedMinutes).toBe(0);
  expect(plan.requiredCount).toBe(0);
  expect(plan.tasks).toHaveLength(1);
  expect(plan.tasks[0].optional).toBe(1);
  expect((await request.post("/api/daily-plan", { data: { action: "mode", date: "2030-01-07", mode: "rest" } })).status()).toBe(400);
});
