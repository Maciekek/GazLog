# GazLog

Track how much you save by driving on LPG instead of petrol. At every fill-up you enter the
distance driven, litres of LPG, the LPG price and the current petrol price. GazLog computes the
LPG cost, what the same distance would have cost on petrol (based on your configured petrol
consumption) and keeps a running total of your savings. Optionally tracks the payback of the
LPG installation cost.

## Stack

- `client/` – Vite + React + TypeScript
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
| `VITE_CONTACT_EMAIL` | empty | Contact address shown on the privacy/terms pages (build-time) |
| `PORT` | `3001` | HTTP port |
| `DATA_DIR` | `server/data` | Where `gazlog.db` lives |

## Docker

```bash
docker compose up -d --build
```

App on http://localhost:3001, database in the `gazlog-data` volume (`/data` inside the container).
`.env` is loaded via `env_file`; `VITE_CONTACT_EMAIL` is passed as a build arg.

Backup:

```bash
docker cp gazlog:/data/gazlog.db ./gazlog-backup.db
```

## Legal pages

`/prywatnosc` (privacy policy) and `/regulamin` (terms), in Polish. Users can delete their account
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
- `GET`/`PUT /api/settings` – `{ petrolConsumption, installCost }`
- `GET /api/fillups` – `{ items, summary }`
- `POST /api/fillups`, `PUT /api/fillups/:id`, `DELETE /api/fillups/:id`
- `DELETE /api/account` – delete the user and all their data
