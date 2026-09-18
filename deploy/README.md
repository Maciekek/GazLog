# Deploying GazLog on a VPS

Runs the prebuilt image from GHCR. Nothing is built on the server. TLS and routing come from
the shared [vps-proxy](https://github.com/Maciekek/vps-proxy) stack: this compose only declares
its domain via labels and joins the `web` network.

## Requirements

- A Linux VPS with Docker and the Compose plugin (`docker compose version`).
- [vps-proxy](https://github.com/Maciekek/vps-proxy) running (owns ports 80/443 and the `web` network).
- A domain with an A (and optionally AAAA) record pointing at the VPS.

## First deploy

```bash
# on the server
mkdir -p ~/gazlog && cd ~/gazlog
curl -fsSLO https://raw.githubusercontent.com/Maciekek/GazLog/main/deploy/docker-compose.yml
curl -fsSLO https://raw.githubusercontent.com/Maciekek/GazLog/main/deploy/update.sh
curl -fsSLO https://raw.githubusercontent.com/Maciekek/GazLog/main/deploy/backup.sh
curl -fsSL  https://raw.githubusercontent.com/Maciekek/GazLog/main/deploy/.env.example -o .env
chmod +x update.sh backup.sh
nano .env          # DOMAIN, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ALLOWED_EMAILS

docker compose up -d
docker compose logs -f
```

Then in Google Cloud Console add the redirect URI `https://<DOMAIN>/api/auth/google/callback`
to the OAuth client, and set the privacy policy / terms links on the consent screen to
`https://<DOMAIN>/privacy` and `https://<DOMAIN>/terms`.

Open `https://<DOMAIN>`.

## Updating

```bash
./update.sh
```

Pulls the newest `latest` (or the tag set in `GAZLOG_TAG`) and restarts if it changed.
To auto-update nightly:

```bash
(crontab -l 2>/dev/null; echo "0 4 * * * $HOME/gazlog/update.sh >> $HOME/gazlog/update.log 2>&1") | crontab -
```

## Backups

```bash
./backup.sh            # -> backups/gazlog-YYYYMMDD-HHMMSS.db, keeps 30 days
```

Nightly:

```bash
(crontab -l 2>/dev/null; echo "30 3 * * * $HOME/gazlog/backup.sh >> $HOME/gazlog/backup.log 2>&1") | crontab -
```

Copy the `backups/` directory somewhere off the server (rclone, scp, object storage).

## Restore

```bash
docker compose stop gazlog
docker cp backups/gazlog-YYYYMMDD-HHMMSS.db gazlog:/data/gazlog.db
docker exec gazlog sh -c 'rm -f /data/gazlog.db-wal /data/gazlog.db-shm'
docker compose start gazlog
```

## Pinning a version

Set `GAZLOG_TAG=1.0.0` (a `v1.0.0` git tag) or a commit sha in `.env`, then `./update.sh`.

## Migrating from the bundled Caddy

Older deployments ran their own `caddy` service from this compose. To switch:

```bash
cd ~/gazlog
docker compose down                       # frees ports 80/443
curl -fsSLO https://raw.githubusercontent.com/Maciekek/GazLog/main/deploy/docker-compose.yml
rm -f Caddyfile
# install vps-proxy (see its README), then:
docker compose up -d --remove-orphans
docker volume rm gazlog_caddy-data gazlog_caddy-config   # old certs, no longer needed
```
