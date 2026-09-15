# GazLog

Liczy, ile oszczędzasz jeżdżąc na LPG zamiast benzyny. Przy każdym tankowaniu wpisujesz
przejechane km, litry LPG, cenę LPG i aktualną cenę benzyny. Aplikacja liczy koszt LPG,
ile kosztowałby ten dystans na benzynie (wg ustawionego spalania) i sumuje oszczędność.
Opcjonalnie śledzi zwrot kosztu instalacji.

## Stack

- `client/` – Vite + React + TypeScript
- `server/` – Node + Express + better-sqlite3 (baza w `server/data/gazlog.db`)

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

## API

- `GET/PUT /api/settings` – `{ petrolConsumption, installCost }`
- `GET /api/fillups` – `{ items, summary }`
- `POST /api/fillups`, `PUT /api/fillups/:id`, `DELETE /api/fillups/:id`
