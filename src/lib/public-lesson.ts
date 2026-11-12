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
});

export type PublicLesson = z.infer<typeof PublicLessonSchema>;
export function publicLessonContent(content: unknown): PublicLesson {
  return PublicLessonSchema.parse(content);
}
