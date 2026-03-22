#!/usr/bin/env bash
set -euo pipefail

# Database backup script for PHPro CRM
# Works with both local Supabase (supabase start) and production (docker compose)
#
# Usage:
#   ./scripts/db-backup.sh              # local dev backup
#   ./scripts/db-backup.sh --prod       # production backup
#
# Backups are stored in supabase/backups/ with timestamp.
# Keeps the last 30 backups by default (configurable via BACKUP_RETAIN).

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/supabase/backups"
RETAIN=${BACKUP_RETAIN:-30}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

if [[ "${1:-}" == "--prod" ]]; then
  source "$PROJECT_DIR/.env"
  FILENAME="prod_${TIMESTAMP}.sql.gz"
  echo "Backing up production database..."
  docker exec supabase-db pg_dump -U postgres -d "${POSTGRES_DB:-postgres}" \
    --no-owner --no-privileges \
    | gzip > "$BACKUP_DIR/$FILENAME"
else
  FILENAME="local_${TIMESTAMP}.sql.gz"
  echo "Backing up local database..."
  pg_dump postgresql://postgres:postgres@127.0.0.1:54322/postgres \
    --no-owner --no-privileges \
    | gzip > "$BACKUP_DIR/$FILENAME"
fi

SIZE=$(du -h "$BACKUP_DIR/$FILENAME" | cut -f1)
echo "Saved: supabase/backups/$FILENAME ($SIZE)"

# Prune old backups (keep most recent $RETAIN)
cd "$BACKUP_DIR"
ls -1t *.sql.gz 2>/dev/null | tail -n +$((RETAIN + 1)) | while read -r f; do rm "$f"; done
TOTAL=$(ls -1 *.sql.gz 2>/dev/null | wc -l | tr -d ' ')
echo "Backups retained: $TOTAL (max $RETAIN)"
