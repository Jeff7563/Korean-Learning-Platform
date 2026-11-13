import type { EpsSkill } from "@/content/eps-topik-bank";

export const epsSkillLessonMap: Record<EpsSkill, { lessonSlug: string; title: string } | null> = {
  vocabulary: { lessonSlug: "eps-vocabulary-grammar-context", title: "คำศัพท์และไวยากรณ์จากบริบท" },
  grammar: { lessonSlug: "eps-vocabulary-grammar-context", title: "คำศัพท์และไวยากรณ์จากบริบท" },
  everyday: { lessonSlug: "eps-listening-everyday-dialogues", title: "ฟังบทสนทนาชีวิตประจำวัน" },
  workplace: { lessonSlug: "eps-listening-workplace-situations", title: "ฟังสถานการณ์ในที่ทำงาน" },
  safety: { lessonSlug: "eps-safety-instructions", title: "คำสั่งและข้อความความปลอดภัย" },
};

export function recommendationsForMissedSkills(skills: string[]) {
  const recommendations = new Map<string, { skill: string; lessonSlug: string; title: string }>();
  const unmapped: string[] = [];
  for (const skill of skills) {
    const mapping = Object.hasOwn(epsSkillLessonMap, skill) ? epsSkillLessonMap[skill as EpsSkill] : null;
    if (!mapping) { unmapped.push(skill); continue; }
    recommendations.set(mapping.lessonSlug, { skill, ...mapping });
  }
  return { recommendations: [...recommendations.values()], unmapped };
}
