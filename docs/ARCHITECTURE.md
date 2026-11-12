# Architecture

- Next.js App Router provides page UI and Node.js route handlers.
- `src/content/curriculum.ts` is the authored source of lesson, exercise, activity and vocabulary content. The seed command copies it into SQLite.
- `drizzle/0001_init.sql` is a versioned SQL migration. SQLite uses foreign keys, uniqueness constraints and indexes. The MVP uses direct SQL with `better-sqlite3` to keep dependencies limited; ORM was not added.
- `scripts/migrate.ts` creates schema and records migration; `scripts/seed.ts` uses upserts and is safe to rerun.
- Progress, activities, checkpoint attempts and answer review remain separate tables. The server owns score calculation and gates later lessons on the previous pass.
- Tutor context includes the selected lesson. Provider credentials remain server-side and requests have a 20-second timeout.
- `data/korean.db` is local persistent storage. Production on an ephemeral/serverless filesystem needs a hosted persistent database adapter/migration.
