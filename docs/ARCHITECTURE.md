# Architecture and operating boundaries

## Runtime

- Next.js App Router serves the pages and Node.js route handlers. SQLite access uses `better-sqlite3` through `src/lib/db.ts`; `KOREAN_DB_PATH` selects an absolute SQLite path and is server-only.
- Local `dev` and `start` scripts bind to `127.0.0.1`. This is a private, single-user Windows study tool; the API has no authentication or per-user ownership boundary and is not suitable for public or multi-user deployment.
- Playwright starts its own app on `127.0.0.1:3101`, disables server reuse, and sets a unique SQLite path under the operating system temporary directory.

## Content and persistence

- `src/content/curriculum.ts`, `src/content/everyday-korean.ts`, and `src/content/korean-grammar.ts` hold 30 main authored lessons across three modules. `src/content/teacher-tips.ts` holds five optional mini-lessons. EPS-TOPIK mock forms are authored in versioned content files and seeded immutably.
- `scripts/migrate.ts` applies ordered SQL migrations and records them in `schema_migrations`. `scripts/seed.ts` adds/updates ordinary lesson, activity, and vocabulary material but never rewrites an existing checkpoint exercise. It compares authored checkpoint content with stored rows and fails on drift.
- Each checkpoint answer now has an immutable snapshot of its question, options, correct index, and explanation. New attempts use `snapshot_kind='captured'`. Migration 0008 copies the last stored exercise text for older attempts using `snapshot_kind='legacy_unverified'`; that is the best available database state and cannot prove it matches the wording shown on the original attempt date.
- For an intentional checkpoint content revision, first back up and verify the database. Update the authored lesson, then run `pnpm db:revise-checkpoint -- <lesson-slug> <question-position> <absolute-verified-backup-path>`. The command verifies the backup is outside the repository and has a valid V0.7.3-compatible schema, then updates only that exercise. Attempt snapshots remain unchanged. Normal seeding intentionally fails until this explicit revision is performed.
- Learner progress, checkpoint attempts, Daily Planner records, SRS review records, and Tutor messages are stored separately from authored content. Checkpoint grading and lesson unlocks remain server-side.

## AI and deployment

The AI Tutor endpoint and provider abstraction remain in source, but no live provider is configured or verified. The rest of the learning system works without AI. Do not expose this app publicly or share one database between learners. Future shared deployment requires authentication, ownership/authorization checks on every learner-data endpoint, rate limiting, and a persistent database strategy.

See [DATABASE-SAFETY.md](./DATABASE-SAFETY.md) before database operations and [WINDOWS-DEV-SERVER.md](./WINDOWS-DEV-SERVER.md) for private local startup.
