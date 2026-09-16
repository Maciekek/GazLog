# GazLog

Track how much you save by driving on LPG instead of petrol. At every fill-up you enter the
distance driven, litres of LPG, the LPG price and the current petrol price. GazLog computes the
LPG cost, what the same distance would have cost on petrol (based on your configured petrol
consumption) and keeps a running total of your savings. Optionally tracks the payback of the
LPG installation cost.

## Stack

- `client/` – Vite + React + TypeScript + react-router
  - `pages/` routed views (landing, tracker layout + home/form/settings, legal, 404), `components/` UI pieces,
    `hooks/useTrackerData.ts` server state, `guides/` articles, `App.tsx` route table + auth gate. `/admin` (role `admin`) lists users.
- `server/` – Node + Express + better-sqlite3 (database at `server/data/gazlog.db`, or `/data` in Docker)
- Google sign-in (server-side OAuth 2.0 authorization code flow, sessions in SQLite)

## Google sign-in

1. Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID (Web application).
2. Authorized redirect URI: `<BASE_URL>/api/auth/google/callback`, e.g. `http://localhost:3001/api/auth/google/callback`.
3. Copy `.env.example` to `.env` and fill in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
4. Optionally set `ALLOWED_EMAILS=you@gmail.com` to restrict sign-in to specific Google accounts.

While the OAuth app is in *Testing* mode, only accounts listed as test users can sign in.
Without OAuth configured, the app shows the landing page without a sign-in button.

## Running locally

Requires Node 22 (`nvm use`).

```bash
npm install
npm run dev        # API on :3001, Vite dev server on :5173 (proxies /api)
```

Production build:

```bash
npm run build
npm start          # serves the API and the built client on :3001
```

Environment variables (see `.env.example`):

| Variable | Default | Purpose |
|---|---|---|
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | – | OAuth credentials |
| `BASE_URL` | `http://localhost:3001` | Public URL; used for the redirect URI and `Secure` cookies when https |
| `ALLOWED_EMAILS` | empty (anyone) | Comma-separated allowlist of Google e-mails |
| `ADMIN_EMAILS` | `maciekek@gmail.com` | Accounts that get the `admin` role; roles are re-synced from this list on every start |
| `VITE_CONTACT_EMAIL` | empty | Contact address shown on the privacy/terms pages (build-time) |
| `PORT` | `3001` | HTTP port |
| `DATA_DIR` | `server/data` | Where `gazlog.db` lives |

## Docker

```bash
docker compose up -d --build
```

App on http://localhost:3001, database in the `gazlog-data` volume (`/data` inside the container).
`.env` is loaded via `env_file`; `VITE_CONTACT_EMAIL` is passed as a build arg.

### Production (VPS)

GitHub Actions builds `ghcr.io/maciekek/gazlog` (linux/amd64 + arm64) on every push to `main`
(`latest`, `<sha>`) and on `v*` tags (`1.2.3`, `1.2`). The contact e-mail baked into the image
comes from the repository variable `VITE_CONTACT_EMAIL`.

See [`deploy/README.md`](deploy/README.md) for running the prebuilt image behind Caddy with
automatic HTTPS, updates and backups. No build step on the server.

Backup:

```bash
docker cp gazlog:/data/gazlog.db ./gazlog-backup.db
```

## Guides (content marketing)

`/guides` lists Polish articles under `client/src/guides/`; each sets its own title, meta
description, canonical and `Article` JSON-LD. Add a guide by creating a component, registering
it in `guides/index.ts`, `GUIDE_ROUTES` in `App.tsx` and `PUBLIC_PAGES` in `server/src/index.ts`
(sitemap + 200 vs 404). Unknown paths return a real 404.

## SEO / marketing assets

- `client/index.html`: title, meta description, keywords, canonical, Open Graph, Twitter card, JSON-LD (`WebApplication`), theme-color.
- `client/public/`: `favicon.svg` + PNG icons, `apple-touch-icon.png`, `manifest.webmanifest` (installable PWA shell), `og.png` (1200×630 share image), `humans.txt`.
- Server generates `/robots.txt` and `/sitemap.xml` from `BASE_URL`, and templates `%GAZLOG_ORIGIN%` in `index.html` with `BASE_URL` at startup, so the public domain is not baked into the Docker image.
- Hashed assets are served with `Cache-Control: immutable`; `index.html` with `no-cache`.

After going live: submit `https://<DOMAIN>/sitemap.xml` in Google Search Console and check the share preview at https://developers.facebook.com/tools/debug/.

## Legal pages

`/privacy` (privacy policy) and `/terms` (terms), in Polish. Users can delete their account
and all data from Settings (requires typing a confirmation phrase).

## How savings are computed

```
LPG cost      = litres × LPG price
Petrol cost   = km / 100 × petrol consumption (l/100 km, from settings) × petrol price
Savings       = petrol cost − LPG cost
```

## API

All endpoints except `/api/auth/*` require a session (cookie `gazlog_session`).

- `GET /api/auth/google` – start sign-in; `GET /api/auth/me`; `POST /api/auth/logout`
- `GET`/`PUT /api/settings` – `{ petrolConsumption, installCost, filterIntervalKm, filterLastKm, inspectionIntervalMonths, inspectionLastDate }`
- `GET /api/fillups` – `{ items, summary }`; `summary.maintenance` carries filter/inspection due status (1000 km / 30 days warning thresholds)
- `POST /api/fillups`, `PUT /api/fillups/:id`, `DELETE /api/fillups/:id` – body: `date, distance_km, lpg_liters, lpg_price, petrol_price, odometer_km?, note?`. Distance is the source of truth; the optional odometer reading lets the form derive one from the other. The first entry is a *baseline* (distance 0, liters 0, odometer required) that anchors odometer-based distances and is excluded from all statistics.
- `DELETE /api/account` – delete the user and all their data
- `GET /api/admin/users` – admin only: accounts with fill-up counts, km, spend, last login
