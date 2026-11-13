# Safe SQLite data handling

The default learner database is `data/korean.db`. `KOREAN_DB_PATH` can select another absolute path ending in `.db`, `.sqlite`, or `.sqlite3`; it is server-only. Playwright always uses a unique temporary database and does not modify the learner database.

## Before database maintenance

1. Check ports 3000 and 3101 using the procedure in [WINDOWS-DEV-SERVER.md](./WINDOWS-DEV-SERVER.md). Stop only a verified KoreanLearning server, using its terminal or its verified process ID. Do not stop unrelated Node processes.
2. Check the current migration names and row counts using SQLite read-only access.
3. Create a unique backup outside this repository and verify SQLite integrity, foreign keys, and the learner-history fingerprint:

   ```powershell
   pnpm db:backup -- D:\Backups\KoreanLearning\korean-YYYYMMDD-HHmmss.db
   ```

   The command refuses to overwrite a file, requires an absolute path outside the repository, uses SQLite's backup API, reopens the copy read-only, and compares integrity checks and the SHA-256 fingerprint/counts for learner, checkpoint, planner, SRS, Tutor, and EPS attempt records.

4. Record the backup path and command output before applying a migration. Afterward, repeat integrity, foreign-key, count, and history-fingerprint checks.

## Migration and restore

Run `pnpm db:migrate` only after the backup has been verified. Migrations are additive and recorded in `schema_migrations`; migration 0008 adds immutable checkpoint answer snapshots without changing attempts, grades, answers, unlock state, EPS history, planner history, SRS history, or Tutor messages.

To restore, stop the application, make and verify a separate backup of the current database, then copy the chosen backup to the configured database path. Do not run `pnpm db:seed` as a restore method. Keep backups outside the repository and protect them like learner records.

## Checkpoint history limitation

Before V0.7.3, checkpoint attempts stored exercise IDs and selected answers but not the question wording or option set. Migration 0008 snapshots the currently stored exercise content for those older answer rows and labels it `legacy_unverified`. This preserves the last known content for inspection, but cannot prove that it is exactly what the learner saw when the attempt was submitted. New attempts store a `captured` snapshot atomically with their answers. Snapshots are immutable.

Normal seeding inserts new exercises and rejects any difference in an existing question. For a deliberate content change, make and verify a backup, edit the authored lesson content, then use `pnpm db:revise-checkpoint -- <lesson-slug> <question-position> <absolute-verified-backup-path>`. The explicit command checks the backup and refuses a revision if any answer is missing a snapshot. Historical score, selected answer, and snapshot remain unchanged.

## E2E database isolation

Playwright starts a dedicated server on `127.0.0.1:3101`, disables server reuse, and sets `KOREAN_DB_PATH` to a unique SQLite file under the operating system temporary directory. Automated E2E tests may alter only that disposable database; they do not reset or modify `data/korean.db`.
