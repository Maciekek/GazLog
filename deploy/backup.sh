#!/usr/bin/env sh
# Consistent SQLite backup (uses the online backup API, safe while the app runs). Keeps 30 days.
set -eu
cd "$(dirname "$0")"
mkdir -p backups
stamp=$(date +%Y%m%d-%H%M%S)
docker exec gazlog node -e "require('better-sqlite3')('/data/gazlog.db').backup('/data/backup.tmp').then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)})"
docker cp gazlog:/data/backup.tmp "backups/gazlog-$stamp.db"
docker exec gazlog rm -f /data/backup.tmp
find backups -name 'gazlog-*.db' -mtime +30 -delete
echo "backups/gazlog-$stamp.db"
