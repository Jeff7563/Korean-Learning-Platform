import { describe, expect, it } from "vitest";
import { getDatabasePath } from "./database-path";
import { publicLessonContent } from "./public-lesson";

describe("database path configuration", () => {
  it("defaults to the local learner database", () => expect(getDatabasePath(undefined, "C:/app")).toBe("C:\\app\\data\\korean.db"));
  it("accepts absolute SQLite paths", () => expect(getDatabasePath("C:\\safe\\learner.sqlite")).toBe("C:\\safe\\learner.sqlite"));
  it("rejects relative or non-SQLite paths", () => {
    expect(() => getDatabasePath("data/test.db")).toThrow(/absolute/);
    expect(() => getDatabasePath("C:/safe/file.txt")).toThrow(/end with/);
  });
});

describe("public lesson projection", () => {
  it("strips checkpoint questions and other private fields", () => {
    const lesson = publicLessonContent({ slug:"x", title:"t", description:"d", objectives:[], explanation:"e", examples:[], activities:[], vocabulary:[], questions:[{answer:1}], answerKey:[1], secret:"private" });
    expect(lesson).not.toHaveProperty("questions");
    expect(lesson).not.toHaveProperty("answerKey");
    expect(JSON.stringify(lesson)).not.toMatch(/answer|secret|private/i);
  });

  it("does not expose an unverified legacy video field", () => {
    const lesson = publicLessonContent({ slug: "x", title: "t", description: "d", objectives: [], explanation: "e", examples: [], activities: [], vocabulary: [], video: { id: "legacy", url: "https://example.test", creator: "unknown", title: "unverified" } });
    expect(lesson).not.toHaveProperty("video");
  });
});
