# Test report

## Latest local run

- `pnpm db:setup`: passed twice; schema applied and 10 lessons seeded idempotently.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed after excluding generated `.next` and `next-env.d.ts` files.
- `pnpm test`: 4 passed, 0 failed.
- `pnpm build`: passed; all app pages and API routes compiled.
- `pnpm test:e2e`: 1 passed. The smoke path opened Dashboard and Lesson 1, checked YouTube embed and fallback, saved an activity, reloaded, failed and retried a checkpoint, verified in-progress and completed states plus the next lesson unlock, and received a response from a local Ollama-compatible test double. An earlier E2E run also asserted the unconfigured AI state returns HTTP 503.

The E2E run required installing Playwright Chromium locally. These results describe the Windows development environment only.

Environment: Windows, Node.js 24, pnpm 12. No Ollama installation or `.env.local` provider configuration was detected. The tutor integration was exercised against a local Ollama-compatible test double and its missing-configuration response was checked. Live AI generation was not tested.
