import {test,expect} from "@playwright/test";
test("learner completes lesson one and progress survives reload",async({page,request})=>{
 const first=await request.get("/api/lessons/hangul-intro");expect(first.ok()).toBeTruthy();const lesson=await first.json();
 await request.post("/api/activities",{data:{activityId:lesson.activities[0].id,completed:false}});
 await page.goto("/dashboard");await expect(page.getByRole("heading",{name:/สวัสดี, ผู้เรียน/})).toBeVisible();
 await page.getByRole("link",{name:/เรียนต่อ/}).click();await expect(page.getByRole("heading",{name:/รู้จัก/})).toBeVisible();await expect(page.getByTitle(/Hangul Song/)).toBeVisible();
 const checkbox=page.getByRole("checkbox").first();await Promise.all([page.waitForResponse(r=>r.url().endsWith("/api/activities")&&r.status()===200),checkbox.click()]);await page.reload();await expect(checkbox).toBeChecked();
 const correct=[0,0,2,1,1];const wrong=[1,1,0,0,0];for(let i=0;i<lesson.exercises.length;i++)await page.locator(`input[name="q${lesson.exercises[i].id}"]`).nth(wrong[i]).check();await page.getByRole("button",{name:"ส่งคำตอบ"}).click();await expect(page.getByText(/คะแนน 0\/5/)).toBeVisible();let course=await request.get("/api/courses");let progress=await course.json();expect(progress.lessons[0].status).toBe("in_progress");expect(progress.lessons[1].status).toBe("locked");
 for(let i=0;i<lesson.exercises.length;i++)await page.locator(`input[name="q${lesson.exercises[i].id}"]`).nth(correct[i]).check();await page.getByRole("button",{name:"ส่งคำตอบ"}).click();await expect(page.getByText(/คะแนน 5\/5/)).toBeVisible();
 await page.reload();await expect(page.getByRole("heading",{name:/รู้จัก/})).toBeVisible();course=await request.get("/api/courses");progress=await course.json();expect(progress.lessons[0].status).toBe("completed");expect(progress.lessons[1].status).toBe("available");
 await page.locator("#tutor textarea").fill("อธิบาย 한글");await page.getByRole("button",{name:/ถาม Tutor/}).click();await expect(page.getByText(/คำตอบทดสอบจาก Ollama-compatible mock/)).toBeVisible();
});
