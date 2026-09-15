# GazLog

Liczy, ile oszczędzasz jeżdżąc na LPG zamiast benzyny. Przy każdym tankowaniu wpisujesz
przejechane km, litry LPG, cenę LPG i aktualną cenę benzyny. Aplikacja liczy koszt LPG,
ile kosztowałby ten dystans na benzynie (wg ustawionego spalania) i sumuje oszczędność.
Opcjonalnie śledzi zwrot kosztu instalacji.

## Stack

- `client/` – Vite + React + TypeScript
- `server/` – Node + Express + better-sqlite3 (baza w `server/data/gazlog.db`)

## Logowanie Google

1. Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID (Web application).
2. Authorized redirect URI: `<BASE_URL>/api/auth/google/callback`, np. `http://localhost:3001/api/auth/google/callback`.
3. Skopiuj `.env.example` do `.env` i wpisz `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
4. Opcjonalnie `ALLOWED_EMAILS=ty@gmail.com` – tylko te konta mogą się zalogować.

Bez skonfigurowanego OAuth aplikacja pokazuje landing bez przycisku logowania.

## Uruchomienie

Wymaga Node 22 (`nvm use`).

```bash
npm install
npm run dev        # server :3001 + client :5173 (proxy /api)
```

Produkcja:

```bash
npm run build
npm start          # serwuje API i zbudowany client na :3001
```

Zmienne: `PORT` (domyślnie 3001), `DATA_DIR` (domyślnie `server/data`).

## Docker

```bash
docker compose up -d --build
```

Aplikacja na http://localhost:3001, baza w wolumenie `gazlog-data` (`/data` w kontenerze).

Backup bazy:

```bash
docker cp gazlog:/data/gazlog.db ./gazlog-backup.db
```

## Strony prawne

`/prywatnosc` (polityka prywatności) i `/regulamin`. Adres kontaktowy podaj w `.env` jako `VITE_CONTACT_EMAIL`
(wbudowywany w klienta przy buildzie, w Dockerze przekazywany jako build arg). Użytkownik może usunąć konto
i wszystkie dane w Ustawieniach (`DELETE /api/account`).

## API

Wszystkie endpointy poza `/api/auth/*` wymagają sesji (cookie `gazlog_session`).

- `GET /api/auth/google` – start logowania, `GET /api/auth/me`, `POST /api/auth/logout`
- `DELETE /api/account` – usuwa konto i wszystkie dane użytkownika
- `GET/PUT /api/settings` – `{ petrolConsumption, installCost }`
- `GET /api/fillups` – `{ items, summary }`
- `POST /api/fillups`, `PUT /api/fillups/:id`, `DELETE /api/fillups/:id`
