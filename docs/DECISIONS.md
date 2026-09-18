# GazLog – decisions and state

Last updated: 2026-09-18.

## Domain model

**Fill-up = tank-to-tank.** A row stores `distance_km` (driven since the *previous* fill-up) and `lpg_liters` (filled *now*, to full). The liters filled now are what was burned over that distance, so consumption = liters / distance. Do not attribute liters forward to the next interval; that is only correct when the tank runs dry every time.

**Savings per row** = `distance/100 × settings.petrolConsumption × petrol_price − lpg_liters × lpg_price`. Petrol consumption is a per-user setting (default 8 l/100 km), not measured.

**Baseline entry** (`distance_km === 0`, `is_baseline`): the first row. Requires an odometer reading; may carry the first tank's liters + price.
- Counts toward: liters, LPG spend, savings (as a pure cost, `saved = −lpg_cost`), savings chart.
- Excluded from: fill-up count, km, consumption average, rolling average, consumption chart.
- Validation: liters and price both zero or both positive; petrol price 0.
- With an empty history the form shows only the baseline form ("Pierwsze tankowanie").

**Odometer** (`odometer_km`, nullable) is convenience, not truth: `distance_km` remains the source for all math. The form toggles between "Przejechane km" and "Stan licznika"; the two are linked through the previous known reading (the row just older than the one being edited). Without any previous reading the toggle is locked on km and a small link reveals an optional first-reading field. Mode is remembered in `localStorage['gazlog.distanceMode']`.

**Maintenance reminders** (`calc.ts → maintenance()`): position = latest odometer reading, else total km. Filter due at `filterLastKm + filterIntervalKm` (default 15 000 km, "soon" ≤ 1000 km); inspection due at `inspectionLastDate + inspectionIntervalMonths` (default 12, "soon" ≤ 30 days). 0 disables. `filterLastKm` null → assumed at the first odometer reading. "Done" buttons on the home view write the current position / today into settings.

**Charts** require ≥ 2 real fill-ups; below that a blurred mock with an overlay is shown. Savings axis may go negative (baseline cost).

## Auth and roles

- Google OAuth authorization-code flow on the server; state in a short-lived cookie; return origin captured at login start (works behind the Vite proxy). Sessions in SQLite, cookie `gazlog_session`, 30 days, `Secure` when `BASE_URL` is https.
- `ALLOWED_EMAILS` (optional allowlist) and `ADMIN_EMAILS` (default `maciekek@gmail.com`). Roles are re-synced from `ADMIN_EMAILS` on every server start. `/admin` and `GET /api/admin/users` are read-only and guarded by `requireAdmin`.
- Account deletion: `DELETE /api/account`, cascades via FK; UI requires typing `USUWAM`.
- Legacy pre-auth rows are adopted by the first user to log in (one-off migration path).

## Routes

App: `/`, `/new`, `/edit/:id`, `/settings`, `/admin`. Public: `/privacy`, `/terms`, `/guides`, `/guides/<slug>` (slugs stay Polish for SEO). Old Polish paths (`/prywatnosc`, `/regulamin`, `/poradnik`, `/nowe`, `/ustawienia`, `/edytuj/:id`) 301 to the new ones. Unknown paths return a real 404 with the SPA shell.

## SEO / marketing

`index.html` carries title/description/canonical/OG/Twitter/JSON-LD; the server injects `BASE_URL` into `%GAZLOG_ORIGIN%`. `/robots.txt` and `/sitemap.xml` are generated from `PUBLIC_PAGES`. Icons, `manifest.webmanifest`, `og.png` (1200×630, has a CTA) in `client/public/`. Three guides exist; more articles are the main growth lever. Search Console verification file `googlebb7f139c93abe8cc.html` is in `client/public/`.

## Infrastructure

| Piece | Where |
|---|---|
| Repo | github.com/Maciekek/GazLog, branch `main` |
| CI | `.github/workflows/docker.yml` → `ghcr.io/maciekek/gazlog` (`latest`, sha, semver on `v*`), public package |
| VPS | Mikrus `tymon342`, root, Docker 24 / Compose 2.21, IPv6 only (`2a01:4f9:2b:195d::342`) |
| Deploy dir | `~/gazlog/deploy` (cloned repo); `.env` there holds Google creds, `DOMAIN=gazlog.pl`, `ACME_EMAIL` |
| Proxy | Caddy in compose, auto Let's Encrypt, `www → apex`, security headers |
| DNS | Cloudflare (registrar GoDaddy, NS `amit`/`ollie.ns.cloudflare.com`); AAAA `@` → VPS IPv6, CNAME `www`, both proxied; SSL mode must be Full (strict) |
| Backups | `deploy/backup.sh` → `deploy/backups/`, 30-day retention; copy off-server manually |
| Update | `deploy/update.sh`; nightly cron suggested (04:00 update, 03:30 backup) |

Google OAuth app is published (production, external). Consent screen links `/privacy` and `/terms`; client secret rotated and prod redirect URI set (done 2026-09-18).

## Known gaps / ideas

- No automated tests (typecheck only). Vitest on `calc.ts` would be the first worthwhile suite.
- No rate limiting on `/api`.
- Link previews in the owner's corporate Mattermost don't render (likely a newly-registered-domain filter on their egress); Cloudflare shows no mitigations and all crawler UAs get 200.
- Ideas queue: CSV import/export, multiple vehicles, petrol fill-ups alongside LPG, PWA offline queue, yearly view, public share link, more guides, uptime monitor, off-site backup.
