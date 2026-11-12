import type Database from "better-sqlite3";

export type ReviewRating = "again" | "hard" | "good";
export type ReviewState = { dueDate: string; intervalDays: number; reviewCount: number; lapseCount: number; lastReviewedDate: string; lastRating: ReviewRating };

export function bangkokLocalDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function addLocalDays(date: string, days: number): string {
  const result = new Date(`${date}T12:00:00.000Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

/** A transparent study aid: Again waits one day, Hard grows by about 1.5x, Good doubles. */
export function scheduleReview(previous: ReviewState | null, rating: ReviewRating, reviewedDate: string): ReviewState {
  const current = previous?.intervalDays ?? 0;
  const intervalDays = rating === "again" ? 1 : rating === "hard" ? Math.max(1, Math.ceil(current * 1.5)) : current === 0 ? 1 : Math.max(3, current * 2);
  return {
    dueDate: addLocalDays(reviewedDate, intervalDays),
    intervalDays,
    reviewCount: (previous?.reviewCount ?? 0) + 1,
    lapseCount: (previous?.lapseCount ?? 0) + Number(rating === "again"),
    lastReviewedDate: reviewedDate,
    lastRating: rating,
  };
}

type VocabularyRow = {
  id: number; lessonId: number; korean: string; thai: string; title: string; moduleTitle: string;
  dueDate: string | null; intervalDays: number | null; reviewCount: number | null; lapseCount: number | null;
  lastReviewedDate: string | null; lastRating: ReviewRating | null;
};

function availableVocabulary(database: Database.Database): VocabularyRow[] {
  const rows = database.prepare(`SELECT l.id lessonId,l.slug,l.position lessonPosition,l.title,m.title moduleTitle,m.position modulePosition,
      EXISTS(SELECT 1 FROM checkpoint_attempts a WHERE a.lesson_id=l.id AND a.passed=1) passed,
      EXISTS(SELECT 1 FROM checkpoint_attempts a WHERE a.lesson_id=l.id)
        OR EXISTS(SELECT 1 FROM learner_activity_progress p JOIN lesson_activities x ON x.id=p.activity_id WHERE x.lesson_id=l.id)
        OR EXISTS(SELECT 1 FROM learner_lesson_progress p WHERE p.lesson_id=l.id) studied
    FROM lessons l JOIN modules m ON m.id=l.module_id JOIN courses c ON c.id=m.course_id
    ORDER BY c.id,m.position,l.position,l.id`).all() as Array<{ lessonId: number; slug: string; lessonPosition: number; title: string; moduleTitle: string; modulePosition: number; passed: number; studied: number }>;
  let prerequisitesPassed = true;
  const eligible = new Set<number>();
  for (const lesson of rows) {
    if (prerequisitesPassed || lesson.studied) eligible.add(lesson.lessonId);
    prerequisitesPassed = prerequisitesPassed && Boolean(lesson.passed);
  }
  if (!eligible.size) return [];
  const placeholders = [...eligible].map(() => "?").join(",");
  return database.prepare(`SELECT v.id,v.lesson_id lessonId,v.korean,v.thai,l.title,m.title moduleTitle,
      s.due_date dueDate,s.interval_days intervalDays,s.review_count reviewCount,s.lapse_count lapseCount,
      s.last_reviewed_date lastReviewedDate,s.last_rating lastRating
    FROM vocabulary v JOIN lessons l ON l.id=v.lesson_id JOIN modules m ON m.id=l.module_id
    LEFT JOIN vocabulary_review_state s ON s.vocabulary_id=v.id
    WHERE v.lesson_id IN (${placeholders}) ORDER BY m.position,l.position,v.id`).all(...eligible) as VocabularyRow[];
}

export function getDueVocabularyCount(database: Database.Database, today = bangkokLocalDate()): number {
  const tableExists = database.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='vocabulary_review_state'").get();
  if (!tableExists) return 0;
  const ids = availableVocabulary(database).map((word) => word.id);
  if (!ids.length) return 0;
  const result = database.prepare(`SELECT count(*) count FROM vocabulary_review_state WHERE due_date<=? AND vocabulary_id IN (${ids.map(() => "?").join(",")})`).get(today, ...ids) as { count: number };
  return result.count;
}

export function getVocabularyReviewData(database: Database.Database, today = bangkokLocalDate()) {
  const all = availableVocabulary(database).map((word) => ({
    id: word.id, korean: word.korean, thai: word.thai, title: word.title, moduleTitle: word.moduleTitle,
    dueDate: word.dueDate, intervalDays: word.intervalDays, reviewCount: word.reviewCount ?? 0, lapseCount: word.lapseCount ?? 0,
    lastReviewedDate: word.lastReviewedDate, lastRating: word.lastRating,
    isNew: word.reviewCount === null, isDue: word.dueDate !== null && word.dueDate <= today,
  }));
  all.sort((a, b) => Number(b.isDue) - Number(a.isDue) || Number(b.lapseCount) - Number(a.lapseCount) || (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") || a.id - b.id);
  const history = database.prepare(`SELECT e.id,e.vocabulary_id vocabularyId,v.korean,v.thai,l.title,m.title moduleTitle,
      e.rating,e.reviewed_date reviewedDate,e.previous_interval_days previousIntervalDays,e.next_interval_days nextIntervalDays,e.created_at createdAt
    FROM vocabulary_review_events e JOIN vocabulary v ON v.id=e.vocabulary_id JOIN lessons l ON l.id=v.lesson_id JOIN modules m ON m.id=l.module_id
    ORDER BY e.id DESC LIMIT 50`).all();
  return {
    today,
    cards: all,
    dueCount: all.filter((word) => word.isDue).length,
    newCount: all.filter((word) => word.isNew).length,
    reviewedToday: new Set(all.filter((word) => word.lastReviewedDate === today).map((word) => word.id)).size,
    nextReviewDate: all.some((word) => word.dueDate && word.dueDate <= today) ? today : all.filter((word) => word.dueDate).map((word) => word.dueDate!).sort()[0] ?? null,
    history,
  };
}

export function recordVocabularyReview(database: Database.Database, vocabularyId: number, rating: ReviewRating, idempotencyKey: string, now = new Date()) {
  const word = availableVocabulary(database).find((item) => item.id === vocabularyId);
  if (!word) return null;
  const today = bangkokLocalDate(now);
  return database.transaction(() => {
    const existingEvent = database.prepare("SELECT vocabulary_id vocabularyId FROM vocabulary_review_events WHERE idempotency_key=?").get(idempotencyKey) as { vocabularyId: number } | undefined;
    if (existingEvent) return { duplicate: true as const, vocabularyId: existingEvent.vocabularyId };
    const getState = database.prepare(`SELECT due_date dueDate,interval_days intervalDays,review_count reviewCount,lapse_count lapseCount,last_reviewed_date lastReviewedDate,last_rating lastRating FROM vocabulary_review_state WHERE vocabulary_id=?`);
    const current = getState.get(vocabularyId) as ReviewState | undefined;
    const next = scheduleReview(current ?? null, rating, today);
    database.prepare(`INSERT INTO vocabulary_review_events(vocabulary_id,idempotency_key,rating,reviewed_date,previous_interval_days,next_interval_days)
      VALUES(?,?,?,?,?,?)`).run(vocabularyId, idempotencyKey, rating, today, current?.intervalDays ?? 0, next.intervalDays);
    database.prepare(`INSERT INTO vocabulary_review_state(vocabulary_id,due_date,interval_days,review_count,lapse_count,last_reviewed_date,last_rating)
      VALUES(?,?,?,?,?,?,?) ON CONFLICT(vocabulary_id) DO UPDATE SET due_date=excluded.due_date,interval_days=excluded.interval_days,
      review_count=excluded.review_count,lapse_count=excluded.lapse_count,last_reviewed_date=excluded.last_reviewed_date,last_rating=excluded.last_rating,updated_at=CURRENT_TIMESTAMP`)
      .run(vocabularyId,next.dueDate,next.intervalDays,next.reviewCount,next.lapseCount,next.lastReviewedDate,next.lastRating);
    return { duplicate: false as const, vocabularyId, state: next };
  })();
}
