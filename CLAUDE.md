# GazLog – working notes for Claude Code

LPG fill-up tracker that computes savings vs petrol. Live at https://gazlog.pl. Owner: Maciej (maciekek@gmail.com).
Read `docs/DECISIONS.md` for domain rules and infra state before changing calculations, routes or deploy.

## Language

- UI, legal pages, guides, commit-facing user text: **Polish**.
- Code, comments, README, commits: **English**.
- Talk to the owner in Polish.

## Layout

```
client/   Vite + React 19 + TS + react-router 7
  src/App.tsx            route table + auth gate
  src/pages/             Landing, Tracker (layout, outlet context), HomeView, FillupFormView, SettingsView, AdminView, Privacy, Terms, NotFound
  src/components/        AppHeader, UserMenu, SummaryCard, FillupList, Charts (hand-rolled SVG), MaintenanceCard, ConfirmDeleteModal
  src/hooks/useTrackerData.ts   server state + mutations for the logged-in app
  src/guides/            SEO articles under /guides/<polish-slug>
  src/api.ts             fetch wrapper + types (keep in sync with server)
  index.html             SEO head; %GAZLOG_ORIGIN% is replaced by the server at startup
server/   Express + better-sqlite3 + zod, ESM, tsx in dev
  src/index.ts           routes, PUBLIC_PAGES / APP_PATHS (200 vs 404, sitemap), legacy 301s, static + SPA fallback
  src/auth.ts            Google OAuth code flow, session cookie, requireUser / requireAdmin
  src/db.ts              schema + migrations (ALTER on start), settings k/v, roles from ADMIN_EMAILS
  src/calc.ts            enrich(), summary(), maintenance() – all money/consumption math lives here
deploy/   production compose (GHCR image + Caddy), .env.example, update.sh, backup.sh, README
```

## Commands

```bash
nvm use                       # Node 22 required
npm install
npm run dev                   # server :3001 (tsx watch, loads ../.env) + Vite :5173 with /api proxy
npm run build                 # client then server
npx tsc -p client/tsconfig.app.json --noEmit && npx tsc -p server/tsconfig.json --noEmit
docker compose up -d --build  # local container on :3001 (dev only; prod is on the VPS)
```

Server env: `GOOGLE_CLIENT_ID/SECRET`, `BASE_URL`, `ALLOWED_EMAILS`, `ADMIN_EMAILS`, `PORT`, `DATA_DIR`, `VITE_CONTACT_EMAIL` (build-time).

## How changes reach production

1. Push to `main` → GitHub Actions typechecks and builds `ghcr.io/maciekek/gazlog:latest` (amd64+arm64), ~5 min.
2. On the VPS: `~/gazlog/deploy/update.sh` (or nightly cron). Nothing is built on the server.
3. Verify from outside with `curl --resolve gazlog.pl:443:104.21.56.125 https://gazlog.pl/...` (Cloudflare edge IP; direct DNS may be cached).

Unauthenticated GitHub API polling gets rate-limited fast; watch the GHCR digest (`docker manifest inspect`) or grep the pulled image instead.

## Testing approach (no automated suite yet)

- Run the server against a scratch DB: `DATA_DIR=<scratch> PORT=3999 GOOGLE_CLIENT_ID=fake GOOGLE_CLIENT_SECRET=fake npx tsx src/index.ts` from `server/`. It serves `client/dist`, so `vite build` first. The server caches `index.html` at startup: **restart after every client build**, and kill whatever holds :3999 first (`ss -ltnp | grep :3999`), otherwise a stale process answers.
- Insert a user + row in `sessions` (token, user_id, expires_at) with better-sqlite3 and pass `Cookie: gazlog_session=<token>` to curl / Playwright.
- Drive the UI with the Playwright MCP; screenshot in light and dark, desktop and 400px.
- Sanity-check money math by hand (see DECISIONS.md for the model).

## Conventions

- One-file-per-view; keep `App.tsx` a route table. Shared server state via `useTracker()` outlet context.
- Any new public page: add to `App.tsx` routes **and** `PUBLIC_PAGES` in `server/src/index.ts` (sitemap + 200). App-only routes go in `APP_PATHS` (200, not in sitemap).
- Schema changes: additive `ALTER TABLE` guarded by `PRAGMA table_info` in `db.ts`; never require a manual migration on the VPS.
- Settings are key/value strings; numeric keys listed in `NUMERIC_KEYS`, `""` means null.
- Don't add chart libraries; extend `Charts.tsx`. Follow the dataviz skill (single accent hue, thin marks, hover tooltip, legend for 2+ series).
- Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
