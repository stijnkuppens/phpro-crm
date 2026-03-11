#!/usr/bin/env bash
set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${GREEN}[setup]${NC} $*"; }
warn()    { echo -e "${YELLOW}[setup]${NC} $*"; }
error()   { echo -e "${RED}[setup]${NC} $*" >&2; exit 1; }

# ── 1. Prerequisites ──────────────────────────────────────────────────────────
info "Checking prerequisites..."

command -v docker  >/dev/null 2>&1 || error "docker is required but not installed."
command -v node    >/dev/null 2>&1 || error "node is required but not installed."
command -v npm     >/dev/null 2>&1 || error "npm is required but not installed."

docker info >/dev/null 2>&1 || error "Docker daemon is not running."

info "Prerequisites OK."

# ── 2. Copy .env.example ──────────────────────────────────────────────────────
if [ ! -f .env ]; then
  info "Copying .env.example to .env..."
  cp .env.example .env
else
  warn ".env already exists — skipping copy."
fi

# ── 3. Generate secrets ───────────────────────────────────────────────────────
info "Generating secrets..."

gen_secret() {
  node -e "process.stdout.write(require('crypto').randomBytes($1).toString('hex'))"
}

JWT_SECRET_VAL=$(gen_secret 32)
POSTGRES_PASSWORD_VAL=$(gen_secret 16)
SECRET_KEY_BASE_VAL=$(gen_secret 64)
VAULT_ENC_KEY_VAL=$(gen_secret 16)
PG_META_CRYPTO_KEY_VAL=$(gen_secret 32)
LOGFLARE_API_KEY_VAL=$(gen_secret 16)
WEBHOOK_SECRET_VAL=$(gen_secret 32)
S3_KEY_ID_VAL=$(gen_secret 16)
S3_KEY_SECRET_VAL=$(gen_secret 32)

# ── 4. Generate ANON_KEY and SERVICE_ROLE_KEY as JWTs ─────────────────────────
info "Generating JWT keys..."

ANON_KEY_VAL=$(node -e "
const crypto = require('crypto');
const secret = '${JWT_SECRET_VAL}';
const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
const payload = Buffer.from(JSON.stringify({
  role: 'anon',
  iss: 'supabase',
  iat: Math.floor(Date.now()/1000),
  exp: Math.floor(Date.now()/1000) + (10 * 365 * 24 * 60 * 60)
})).toString('base64url');
const sig = crypto.createHmac('sha256', secret).update(header + '.' + payload).digest('base64url');
process.stdout.write(header + '.' + payload + '.' + sig);
")

SERVICE_ROLE_KEY_VAL=$(node -e "
const crypto = require('crypto');
const secret = '${JWT_SECRET_VAL}';
const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
const payload = Buffer.from(JSON.stringify({
  role: 'service_role',
  iss: 'supabase',
  iat: Math.floor(Date.now()/1000),
  exp: Math.floor(Date.now()/1000) + (10 * 365 * 24 * 60 * 60)
})).toString('base64url');
const sig = crypto.createHmac('sha256', secret).update(header + '.' + payload).digest('base64url');
process.stdout.write(header + '.' + payload + '.' + sig);
")

# ── 5. Write secrets into .env ────────────────────────────────────────────────
info "Writing secrets to .env..."

perl -pi -e "s|JWT_SECRET=<generated>|JWT_SECRET=${JWT_SECRET_VAL}|g" .env
perl -pi -e "s|POSTGRES_PASSWORD=<generated>|POSTGRES_PASSWORD=${POSTGRES_PASSWORD_VAL}|g" .env
perl -pi -e "s|SECRET_KEY_BASE=<generated>|SECRET_KEY_BASE=${SECRET_KEY_BASE_VAL}|g" .env
perl -pi -e "s|VAULT_ENC_KEY=<generated>|VAULT_ENC_KEY=${VAULT_ENC_KEY_VAL}|g" .env
perl -pi -e "s|PG_META_CRYPTO_KEY=<generated>|PG_META_CRYPTO_KEY=${PG_META_CRYPTO_KEY_VAL}|g" .env
perl -pi -e "s|LOGFLARE_API_KEY=<generated>|LOGFLARE_API_KEY=${LOGFLARE_API_KEY_VAL}|g" .env
perl -pi -e "s|WEBHOOK_SECRET=<generated>|WEBHOOK_SECRET=${WEBHOOK_SECRET_VAL}|g" .env
perl -pi -e "s|S3_PROTOCOL_ACCESS_KEY_ID=<generated>|S3_PROTOCOL_ACCESS_KEY_ID=${S3_KEY_ID_VAL}|g" .env
perl -pi -e "s|S3_PROTOCOL_ACCESS_KEY_SECRET=<generated>|S3_PROTOCOL_ACCESS_KEY_SECRET=${S3_KEY_SECRET_VAL}|g" .env

# Escape forward slashes in JWT tokens for perl substitution
ANON_KEY_ESCAPED=$(echo "$ANON_KEY_VAL" | sed 's|/|\\/|g')
SERVICE_ROLE_KEY_ESCAPED=$(echo "$SERVICE_ROLE_KEY_VAL" | sed 's|/|\\/|g')

perl -pi -e "s|ANON_KEY=<generated>|ANON_KEY=${ANON_KEY_ESCAPED}|g" .env
perl -pi -e "s|SERVICE_ROLE_KEY=<generated>|SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY_ESCAPED}|g" .env
perl -pi -e "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=<generated>|NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY_ESCAPED}|g" .env
perl -pi -e "s|SUPABASE_SERVICE_ROLE_KEY=<generated>|SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY_ESCAPED}|g" .env

info "Secrets written."

# ── 6. npm install ────────────────────────────────────────────────────────────
info "Installing npm dependencies..."
npm install

# ── 7. Start docker compose ───────────────────────────────────────────────────
info "Starting Supabase services..."
docker compose up -d

# ── 8. Wait for DB ────────────────────────────────────────────────────────────
info "Waiting for database to be ready..."
MAX_ATTEMPTS=30
ATTEMPT=0
until docker compose exec -T db pg_isready -U postgres >/dev/null 2>&1; do
  ATTEMPT=$((ATTEMPT + 1))
  if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
    error "Database did not become ready in time."
  fi
  echo -n "."
  sleep 2
done
echo ""
info "Database is ready."

# Load env vars for subsequent commands
set -a
# shellcheck disable=SC1091
source .env
set +a

# ── 9. Run migrations ─────────────────────────────────────────────────────────
info "Running database migrations..."
if [ -d "supabase/migrations" ] && [ "$(ls -A supabase/migrations 2>/dev/null)" ]; then
  for f in supabase/migrations/*.sql; do
    info "Applying $(basename "$f")..."
    docker compose exec -T db psql -U postgres -d postgres < "$f" || warn "Migration $(basename "$f") had errors."
  done
else
  warn "No migrations directory found — skipping."
fi

# ── 10. Seed database ─────────────────────────────────────────────────────────
info "Seeding database..."
if [ -f "supabase/seed.sql" ]; then
  docker compose exec -T db psql -U postgres -d postgres < supabase/seed.sql || warn "Seeding failed."
else
  warn "No seed.sql found — skipping."
fi

# ── 11. Generate TypeScript types ─────────────────────────────────────────────
info "Generating TypeScript types..."
mkdir -p src/types
npx supabase gen types typescript \
  --db-url "postgresql://postgres:${POSTGRES_PASSWORD}@127.0.0.1:5432/postgres" \
  --schema public \
  > src/types/database.types.ts 2>/dev/null || warn "Type generation failed — run 'task types:generate' later."

# ── 12. Success ───────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "  App (dev):       http://localhost:3000"
echo "  Supabase API:    http://localhost:8000"
echo "  Supabase Studio: http://localhost:3001"
echo ""
echo "  Studio login:"
echo "    Username: ${DASHBOARD_USERNAME}"
echo "    Password: ${DASHBOARD_PASSWORD}"
echo ""
echo "  Run 'task dev:next' to start the Next.js dev server."
echo ""
