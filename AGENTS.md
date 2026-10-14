## Demo build

- This copy is a **standalone portfolio demo** — there is no Express/Prisma/MySQL backend.
  `src/lib/api.ts` dispatches all calls to the in-browser demo API in
  `src/lib/demo-api.ts` (fictional seeds, localStorage persistence).
- Demo logins: `admin@demo.io`/`admin123`, `manager@demo.io`/`manager123`,
  `staff@demo.io`/`staff123`.
- The two raw `fetch` exports (analytics CSV, settings backup) go through
  `downloadCsv`/`downloadBackup` in `src/lib/api.ts`.
- Private internal tool: keep robots.txt `Disallow: /`.

## Deployment

- Vercel: plain `vite build` — `vite.config.ts` emits the Vercel nitro preset
  automatically when `VERCEL=1` is set.

## Verification

- `npx tsc --noEmit -p .`
- `npx eslint <changed files>` (prettier is enforced via eslint; fix with
  `npx prettier --write <file>`)
- `npx tsx test-demo.ts` exercises the demo API end to end.
