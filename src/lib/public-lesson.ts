import { z } from "zod";

// This schema is intentionally an allowlist. Unknown lesson fields (including
// quiz questions, answer keys, and future private fields) are stripped.
const PublicLessonSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  objectives: z.array(z.string()),
  explanation: z.string(),
  examples: z.array(z.string()),
  activities: z.array(z.string()),
  vocabulary: z.array(z.object({ korean: z.string(), thai: z.string() })),
  dialogue: z.array(z.object({ speaker: z.string(), korean: z.string(), thai: z.string() })).optional(),
  practicePrompts: z.array(z.string()).optional(),
  commonMistakes: z.array(z.string()).optional(),
});

export type PublicLesson = z.infer<typeof PublicLessonSchema>;
export function publicLessonContent(content: unknown): PublicLesson {
  return PublicLessonSchema.parse(content);
}
