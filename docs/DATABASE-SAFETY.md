# Safe SQLite data handling

Learner progress is stored in SQLite. The default database is `data/korean.db`.
Set the server-side `KOREAN_DB_PATH` environment variable to an absolute path ending in `.db`, `.sqlite`, or `.sqlite3` to use another location. Do not expose this variable to browser code.

## Backup and restore

Stop the app before copying or restoring its database. Keep backups outside the repository and protect them like learner records. With SQLite closed, copy the database file to a dated backup file, for example `Copy-Item data/korean.db D:\\Backups\\korean-2026-11-12.db`. Restore by first copying the current database to a separate safety file, then copy the selected backup over the configured database path. Never run `pnpm db:seed` as a restore method. The migration command is safe to rerun and preserves progress tables.

## E2E database isolation

Playwright starts a dedicated app on port 3101 with a unique SQLite file under the operating system temporary directory. It does not reuse an existing server. E2E tests can modify only that disposable test database; normal learner data is not reset or modified by the test run.
