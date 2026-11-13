# V0.7.3 verification record

## Verification commands

| Command | Result |
| --- | --- |
| `pnpm typecheck` | Passed |
| `pnpm lint` | Passed |
| `pnpm test` | Passed: 48 tests in 10 files |
| `pnpm build` | Passed: production build and 22 static pages generated |
| `pnpm test:e2e` | Passed: 13 Playwright tests on isolated temporary SQLite |

E2E includes invalid checkpoint request rejection without progress changes, mobile navigation and keyboard focus, checkpoint history snapshots and persistence, curriculum completion/unlock, EPS simulator semantics, planner, review SRS, and desktop/mobile layout journeys. Playwright uses a unique temporary `KOREAN_DB_PATH`; these runs do not use `data/korean.db`.

## Database migration verification

Migration `0008_checkpoint_answer_snapshots.sql` was applied to the local learner database after a verified external backup. Before and after migration, the SHA-256 fingerprint of existing learner, checkpoint, planner, Tutor, SRS, and EPS attempt rows was identical. The migration added 10 `legacy_unverified` snapshots for 10 existing checkpoint answers; it did not change their attempts, scores, answers, lesson progress, planner data, SRS records, Tutor messages, or EPS records. After migration, `integrity_check` returned `ok`, `foreign_key_check` returned no rows, and all 10 checkpoint answers had snapshots.

The old checkpoint rows had no original question snapshots. Their migration backfill preserves the last content stored in the database but cannot establish that it exactly matches what the learner saw on the attempt date. New attempts use captured snapshots.

The EPS question bank and immutable form versioning were not changed. The live AI provider was not configured or tested; E2E Tutor checks, where exercised, use a local test double only.
