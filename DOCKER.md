# Docker Setup — PHPro CRM

This project uses the **official Supabase Docker Compose stack** for both local development and production. There is one `docker-compose.yml` — environment differences are handled via `.env` files.

## Contents

1. [Architecture](#architecture)
2. [Local Development](#local-development)
3. [Commands Reference](#commands-reference)
4. [Generating TypeScript Types](#generating-typescript-types)
5. [Build Scripts](#build-scripts)
6. [Environment Variables](#environment-variables)
7. [Configuring Auth](#configuring-auth)
8. [Configuring OAuth Providers](#configuring-oauth-providers)
9. [Configuring SMTP](#configuring-smtp)
10. [Configuring MFA](#configuring-mfa)
11. [Configuring Storage](#configuring-storage)
12. [Database Migrations](#database-migrations)
13. [Production Deployment](#production-deployment)
14. [HTTPS Setup](#https-setup)
15. [Backups](#backups)
16. [Updating](#updating)
17. [Troubleshooting](#troubleshooting)

---

## Architecture

The stack consists of these services:

| Service | Container | Image | Port | Role |
|---------|-----------|-------|------|------|
| **Studio** | `supabase-studio` | `supabase/studio` | — (via Kong) | Dashboard UI |
| **Kong** | `supabase-kong` | `kong/kong` | `8000` (HTTP), `8443` (HTTPS) | API gateway — all traffic enters here |
| **Auth** | `supabase-auth` | `supabase/gotrue` | `9999` (internal) | JWT auth, OAuth, magic links |
| **REST** | `supabase-rest` | `postgrest/postgrest` | `3000` (internal) | Auto-generated REST API from Postgres |
| **Realtime** | `realtime-dev.supabase-realtime` | `supabase/realtime` | `4000` (internal) | WebSocket broadcast of DB changes |
| **Storage** | `supabase-storage` | `supabase/storage-api` | `5000` (internal) | File storage API |
| **imgproxy** | `supabase-imgproxy` | `darthsim/imgproxy` | `5001` (internal) | On-the-fly image resizing |
| **Meta** | `supabase-meta` | `supabase/postgres-meta` | `8080` (internal) | DB management API for Studio |
| **Functions** | `supabase-edge-functions` | `supabase/edge-runtime` | `9000` (internal) | Deno-based edge functions |
| **Analytics** | `supabase-analytics` | `supabase/logflare` | `4000` (internal) | Log ingestion and querying |
| **DB** | `supabase-db` | `supabase/postgres` | `5432` (internal) | PostgreSQL with Supabase extensions |
| **Vector** | `supabase-vector` | `timberio/vector` | `9001` (internal) | Log pipeline to Logflare |
| **Supavisor** | `supabase-pooler` | `supabase/supavisor` | `54322` (session), `6543` (transaction) | Connection pooler |
| **Next.js** | `phpro-crm-nextjs` | Custom build | `3000` | App (production profile only) |

### How traffic flows

```
Browser → Kong (:8000) → routes to:
  /auth/v1/*       → Auth (:9999)
  /rest/v1/*       → REST (:3000)
  /realtime/v1/*   → Realtime (:4000)
  /storage/v1/*    → Storage (:5000)
  /functions/v1/*  → Functions (:9000)
  /pg/*            → Meta (:8080)
  /*               → Studio (:3000)   ← protected by HTTP Basic Auth
```

Your Next.js app connects to Kong at `http://localhost:8000` (local dev) or `https://your-domain.com` (production).

---

## Local Development

### Prerequisites

- Docker Desktop (macOS/Windows) or Docker Engine + Compose (Linux)
- Node.js 20+
- [Task](https://taskfile.dev/) runner (`brew install go-task`)

### First-time setup

```bash
# 1. Copy the example env (already done if you cloned the repo)
cp .env.example .env

# 2. Pull all Docker images
docker compose pull

# 3. Start all Supabase services
docker compose up -d

# 4. Wait for services to be healthy (~60 seconds)
docker compose ps    # all should show "healthy"

# 5. Apply database migrations
task db:migrate

# 6. Load production data + demo fixtures
task db:data
task db:fixtures

# 7. Start Next.js (in a separate terminal)
npm run dev
```

### Access points (local)

| Service | URL | Credentials |
|---------|-----|-------------|
| **Next.js app** | http://localhost:3000 | — |
| **Supabase Studio** | http://localhost:8000 | `supabase` / `supabase` |
| **REST API** | http://localhost:8000/rest/v1/ | Pass `apikey` header |
| **Auth API** | http://localhost:8000/auth/v1/ | Pass `apikey` header |
| **Database (session)** | `localhost:54322` | `postgres` / (see POSTGRES_PASSWORD in .env) |
| **Database (transaction pool)** | `localhost:6543` | `postgres.phpro-crm` / (password) |
| **Inbucket (email)** | Not included — emails go to Logflare logs | — |

### Daily workflow

```bash
task dev:supabase    # Start Supabase containers (if not running)
npm run dev          # Start Next.js dev server

# Or start both:
task dev
```

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `task dev` | Start Supabase + Next.js |
| `task dev:supabase` | Start Supabase containers only |
| `task dev:next` | Start Next.js only |
| `task dev:stop` | Stop all Supabase containers |
| `task dev:restart` | Restart Supabase containers |
| `task dev:status` | Show container status |
| `task dev:logs` | Tail logs from all containers |
| `task dev:studio` | Open Studio in browser |
| `task db:migrate` | Apply pending migrations |
| `task db:migrate:dry` | Preview migrations (dry run) |
| `task db:new-migration -- <name>` | Create new migration file |
| `task db:reset` | Destroy DB + recreate + migrate + seed |
| `task db:data` | Apply production data |
| `task db:fixtures` | Load demo fixtures |
| `task db:psql` | Open psql shell |
| `task db:backup` | Backup database |
| `task db:restore -- <file>` | Restore from backup |
| `task types:generate` | Generate TypeScript types from DB schema |
| `task prod:up` | Start full prod stack (with Next.js in Docker) |
| `task prod:down` | Stop prod stack |
| `task clean` | Stop + remove all volumes (**DESTROYS DATA**) |

---

## Generating TypeScript Types

TypeScript types are generated from the live database schema using the Supabase CLI. This project uses Docker Compose (not `supabase start`), so the CLI connects through the **Supavisor pooler** on port `54322`.

### Quick command

```bash
task types:generate
```

This runs `npx supabase gen types typescript --db-url <pooler-url> --schema public` and writes the output to `src/types/database.ts`.

### Requirements

- The Supabase Docker stack must be running (`docker compose up -d`)
- Migrations must be applied (`task db:migrate`)
- The Supabase CLI uses **`localhost`** (not `127.0.0.1`) — some CLI versions fail with the IP address due to an internal `supabase start` check

### When to regenerate

Run `task types:generate` after:
- Creating or modifying a migration (`supabase/migrations/*.sql`)
- Adding/removing tables or columns
- Running `task db:reset`

### Manual command (without Taskfile)

```bash
npx supabase gen types typescript \
  --db-url "postgresql://postgres.<POOLER_TENANT_ID>:<POSTGRES_PASSWORD>@localhost:<POOLER_SESSION_PORT>/postgres" \
  --schema public \
  > src/types/database.ts
```

Replace the placeholders with values from your `.env` file. The default local connection string is:

```
postgresql://postgres.phpro-crm:<POSTGRES_PASSWORD>@localhost:54322/postgres
```

---

## Build Scripts

### Local development (from scratch)

```bash
# 1. Clone and install
git clone <repo-url> && cd phpro-crm
cp .env.example .env          # Edit secrets if needed
npm install

# 2. Start Supabase
docker compose pull
docker compose up -d
sleep 10                       # Wait for DB to be healthy

# 3. Database setup
task db:migrate                # Apply schema migrations
task db:data                   # Load production reference data
task db:fixtures               # Load demo data (dev only)

# 4. Generate TypeScript types
task types:generate

# 5. Start dev server
npm run dev                    # http://localhost:3000
```

### Production build & deploy

```bash
# 1. Pull latest code
cd /opt/phpro-crm
git pull origin main

# 2. Install dependencies
npm ci --production=false      # Need devDeps for build

# 3. Start/update Supabase stack
docker compose pull
docker compose up -d
sleep 10

# 4. Apply migrations
task db:migrate

# 5. Load production data (idempotent — safe to re-run)
task db:data

# 6. Generate TypeScript types from live DB
task types:generate

# 7. Build Next.js
npm run build

# 8. Start production (choose one):

# Option A: Next.js outside Docker
npm run start                  # Runs on port 3000

# Option B: Next.js inside Docker (uses prod profile)
docker compose --profile prod up -d --build
```

### CI/CD pipeline summary

```
git push → install deps → docker compose up → db:migrate → db:data → types:generate → npm run build → deploy
```

---

## Environment Variables

All configuration lives in `.env`. The same file drives both local and production — you just change the values.

### Secrets (MUST change for production)

| Variable | Purpose | Generate with |
|----------|---------|---------------|
| `POSTGRES_PASSWORD` | Database password (letters+numbers only) | `openssl rand -base64 24` |
| `JWT_SECRET` | Signs/verifies all JWTs (min 32 chars) | `openssl rand -base64 32` |
| `ANON_KEY` | Client-side API key (anon role JWT) | JWT generator (see below) |
| `SERVICE_ROLE_KEY` | Server-side API key (full access JWT) | JWT generator (see below) |
| `SECRET_KEY_BASE` | Realtime + Supavisor encryption (min 64 chars) | `openssl rand -base64 48` |
| `VAULT_ENC_KEY` | Supavisor config encryption (exactly 32 chars) | `openssl rand -hex 16` |
| `PG_META_CRYPTO_KEY` | Studio → postgres-meta encryption (min 32 chars) | `openssl rand -base64 24` |
| `LOGFLARE_PUBLIC_ACCESS_TOKEN` | Log ingestion token (min 32 chars) | `openssl rand -base64 24` |
| `LOGFLARE_PRIVATE_ACCESS_TOKEN` | Log admin token (min 32 chars) | `openssl rand -base64 24` |
| `S3_PROTOCOL_ACCESS_KEY_ID` | Storage S3 protocol access key | `openssl rand -hex 16` |
| `S3_PROTOCOL_ACCESS_KEY_SECRET` | Storage S3 protocol secret | `openssl rand -hex 32` |
| `DASHBOARD_USERNAME` | Studio HTTP Basic Auth username | Choose one |
| `DASHBOARD_PASSWORD` | Studio HTTP Basic Auth password (must include a letter) | Choose one |

**Generating ANON_KEY and SERVICE_ROLE_KEY:**

These are JWTs signed with your `JWT_SECRET`. Use the [Supabase JWT generator](https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys) or:

```bash
# After setting JWT_SECRET, generate keys:
# ANON_KEY payload:         {"role": "anon", "iss": "supabase", "iat": ..., "exp": ...}
# SERVICE_ROLE_KEY payload: {"role": "service_role", "iss": "supabase", "iat": ..., "exp": ...}
```

### URLs

| Variable | Local | Production |
|----------|-------|------------|
| `SUPABASE_PUBLIC_URL` | `http://localhost:8000` | `https://supabase.yourdomain.com` |
| `API_EXTERNAL_URL` | `http://localhost:8000` | `https://supabase.yourdomain.com` |
| `SITE_URL` | `http://localhost:3000` | `https://crm.yourdomain.com` |
| `ADDITIONAL_REDIRECT_URLS` | (empty) | Comma-separated allowed redirect URLs |

### Database

| Variable | Default | Notes |
|----------|---------|-------|
| `POSTGRES_HOST` | `db` | Always `db` (Docker service name) |
| `POSTGRES_DB` | `postgres` | Database name |
| `POSTGRES_PORT` | `5432` | Internal port (inside Docker network) |

### Supavisor (Connection Pooler)

| Variable | Default | Notes |
|----------|---------|-------|
| `POOLER_SESSION_PORT` | `54322` | External port for session-mode connections |
| `POOLER_PROXY_PORT_TRANSACTION` | `6543` | External port for transaction-mode pooling |
| `POOLER_DEFAULT_POOL_SIZE` | `20` | Max Postgres connections per pool |
| `POOLER_MAX_CLIENT_CONN` | `100` | Max client connections per pool |
| `POOLER_TENANT_ID` | `phpro-crm` | Tenant identifier for connection strings |
| `POOLER_DB_POOL_SIZE` | `5` | Internal metadata pool size |

**Connection strings:**

```bash
# Session mode (like direct Postgres):
postgresql://postgres.phpro-crm:<password>@localhost:54322/postgres

# Transaction mode (pooled):
postgresql://postgres.phpro-crm:<password>@localhost:6543/postgres
```

### Auth

| Variable | Default | Notes |
|----------|---------|-------|
| `JWT_EXPIRY` | `3600` | Access token lifetime in seconds |
| `DISABLE_SIGNUP` | `false` | Set `true` to disable public registration |
| `ENABLE_EMAIL_SIGNUP` | `true` | Enable email/password sign-up |
| `ENABLE_EMAIL_AUTOCONFIRM` | `true` (local) / `false` (prod) | Skip email verification |
| `ENABLE_ANONYMOUS_USERS` | `false` | Enable anonymous sign-in |
| `ENABLE_PHONE_SIGNUP` | `false` | Enable phone auth |
| `ENABLE_PHONE_AUTOCONFIRM` | `true` | Skip phone verification |

### PostgREST

| Variable | Default | Notes |
|----------|---------|-------|
| `PGRST_DB_SCHEMAS` | `public,storage,graphql_public` | Schemas exposed via REST |
| `PGRST_DB_MAX_ROWS` | `1000` | Max rows per request |

### Kong (API Gateway)

| Variable | Default | Notes |
|----------|---------|-------|
| `KONG_HTTP_PORT` | `8000` | HTTP port |
| `KONG_HTTPS_PORT` | `8443` | HTTPS port |

### Edge Functions

| Variable | Default | Notes |
|----------|---------|-------|
| `FUNCTIONS_VERIFY_JWT` | `false` | Require JWT for all edge functions |

### Docker

| Variable | Default | Notes |
|----------|---------|-------|
| `DOCKER_SOCKET_LOCATION` | `/var/run/docker.sock` | macOS default. Linux rootless: `/run/user/1000/docker.sock` |

---

## Configuring Auth

Auth is controlled via the `auth` service environment variables in `docker-compose.yml`, which reference `.env` variables.

### Token lifetime

```env
JWT_EXPIRY=3600    # 1 hour (default). Max: 604800 (1 week)
```

### Disable public sign-up

```env
DISABLE_SIGNUP=true
```

### Require email confirmation

```env
ENABLE_EMAIL_AUTOCONFIRM=false   # MUST be false in production
```

---

## Configuring OAuth Providers

### Step 1: Set env vars in `.env`

```env
GOOGLE_ENABLED=true
GOOGLE_CLIENT_ID=your-client-id-from-google-console
GOOGLE_SECRET=your-client-secret-from-google-console
```

### Step 2: Uncomment the matching lines in `docker-compose.yml`

In the `auth` service, uncomment:

```yaml
GOTRUE_EXTERNAL_GOOGLE_ENABLED: ${GOOGLE_ENABLED}
GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
GOTRUE_EXTERNAL_GOOGLE_SECRET: ${GOOGLE_SECRET}
```

### Step 3: Register the callback URL with the provider

```
https://your-domain.com/auth/v1/callback     # production
http://localhost:8000/auth/v1/callback        # local dev
```

### Step 4: Restart auth

```bash
docker compose up -d --force-recreate --no-deps auth
```

### Supported providers

Google, GitHub, Azure, Apple, Bitbucket, Discord, Facebook, Figma, GitLab, Kakao, Keycloak, LinkedIn (OIDC), Notion, Slack (OIDC), Spotify, Twitch, Twitter/X, WorkOS, Zoom.

All follow the same `GOTRUE_EXTERNAL_<PROVIDER>_*` pattern.

### Verify configuration

```bash
docker compose exec auth env | grep GOTRUE_EXTERNAL
```

---

## Configuring SMTP

### Local development

Local dev uses fake SMTP credentials — emails are visible in the analytics/logs. For actual email delivery locally, set up a real SMTP provider.

### Production

```env
SMTP_HOST=smtp.sendgrid.net        # or smtp.postmarkapp.com, ses-smtp-prod.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=apikey                    # provider-specific
SMTP_PASS=your-smtp-api-key
SMTP_ADMIN_EMAIL=noreply@yourdomain.com
SMTP_SENDER_NAME=PHPro CRM
ENABLE_EMAIL_AUTOCONFIRM=false      # MUST be false in production
```

Restart auth after changing: `docker compose up -d --force-recreate --no-deps auth`

---

## Configuring MFA

### Step 1: Set env vars in `.env`

```env
MFA_TOTP_ENROLL_ENABLED=true
MFA_TOTP_VERIFY_ENABLED=true
MFA_MAX_ENROLLED_FACTORS=10

# Phone MFA (requires SMS provider)
MFA_PHONE_ENROLL_ENABLED=false
MFA_PHONE_VERIFY_ENABLED=false
```

### Step 2: Uncomment in `docker-compose.yml`

```yaml
GOTRUE_MFA_TOTP_ENROLL_ENABLED: ${MFA_TOTP_ENROLL_ENABLED}
GOTRUE_MFA_TOTP_VERIFY_ENABLED: ${MFA_TOTP_VERIFY_ENABLED}
GOTRUE_MFA_MAX_ENROLLED_FACTORS: ${MFA_MAX_ENROLLED_FACTORS}
```

---

## Configuring Storage

### Local (default): file system

Files are stored in `docker/volumes/storage/`. No configuration needed.

### External S3 backend

To store files in S3 instead of locally, edit the `storage` service in `docker-compose.yml`:

```yaml
STORAGE_BACKEND: s3
GLOBAL_S3_BUCKET: your-bucket-name
AWS_ACCESS_KEY_ID: your-key
AWS_SECRET_ACCESS_KEY: your-secret
REGION: eu-central-1
```

For non-AWS S3 (Cloudflare R2, DigitalOcean Spaces, MinIO):

```yaml
GLOBAL_S3_ENDPOINT: https://your-endpoint.com
GLOBAL_S3_FORCE_PATH_STYLE: "true"
```

**Cloudflare R2 gotcha:** Add `TUS_ALLOW_S3_TAGS=false` to prevent 500 errors on resumable uploads.

---

## Database Migrations

Migrations live in `supabase/migrations/` and are applied via the Supabase CLI with `--db-url`.

### Apply migrations

```bash
# Local
task db:migrate

# Dry run (preview only)
task db:migrate:dry

# Production (from your local machine or CI)
npx supabase db push --db-url "postgresql://postgres:PASSWORD@your-server:5432/postgres"
```

### Create a new migration

```bash
task db:new-migration -- add_comments_table
# Creates: supabase/migrations/00017_add_comments_table.sql
```

### Full reset (local only — DESTROYS DATA)

```bash
task db:reset
```

### CI/CD

```yaml
# GitHub Actions example
- name: Deploy migrations
  run: |
    npx supabase db push --dry-run --db-url "${{ secrets.PRODUCTION_DB_URL }}"
    npx supabase db push --db-url "${{ secrets.PRODUCTION_DB_URL }}"
```

---

## Production Deployment

### Step 1: Provision a server

- Minimum: 4GB RAM, 2 CPU, 50GB SSD
- Recommended: 8GB RAM, 4 CPU, 80GB SSD
- OS: Ubuntu 22.04+ or Debian 12+
- Install Docker Engine + Docker Compose

### Step 2: Clone and configure

```bash
# On the server
git clone https://github.com/your-org/phpro-crm.git /opt/phpro-crm
cd /opt/phpro-crm

# Create production .env from example
cp .env.example .env
```

### Step 3: Generate all production secrets

```bash
# Generate each secret
openssl rand -base64 24    # POSTGRES_PASSWORD (use only letters+numbers!)
openssl rand -base64 32    # JWT_SECRET
openssl rand -base64 48    # SECRET_KEY_BASE
openssl rand -hex 16       # VAULT_ENC_KEY
openssl rand -base64 24    # PG_META_CRYPTO_KEY
openssl rand -base64 24    # LOGFLARE tokens (x2)
openssl rand -hex 16       # S3_PROTOCOL_ACCESS_KEY_ID
openssl rand -hex 32       # S3_PROTOCOL_ACCESS_KEY_SECRET
```

Then generate ANON_KEY and SERVICE_ROLE_KEY as JWTs signed with your new JWT_SECRET.

### Step 4: Set production URLs

```env
SUPABASE_PUBLIC_URL=https://supabase.yourdomain.com
API_EXTERNAL_URL=https://supabase.yourdomain.com
SITE_URL=https://crm.yourdomain.com
```

### Step 5: Configure SMTP

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxx
SMTP_ADMIN_EMAIL=noreply@yourdomain.com
SMTP_SENDER_NAME=PHPro CRM
ENABLE_EMAIL_AUTOCONFIRM=false
```

### Step 6: Set dashboard credentials

```env
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=YourStrongPasswordWithLetters123
```

### Step 7: Start the stack

```bash
docker compose pull
docker compose --profile prod up -d --build
```

### Step 8: Apply migrations

```bash
npx supabase db push --db-url "postgresql://postgres:PASSWORD@localhost:5432/postgres"
```

### Step 9: Load production data

```bash
for f in supabase/data/*.sql; do
  docker exec -i supabase-db psql -U postgres -q < "$f"
done
```

### Production .env changes vs local

| Variable | Local | Production |
|----------|-------|------------|
| `POSTGRES_PASSWORD` | Default placeholder | Generated secret |
| `JWT_SECRET` | Default placeholder | Generated secret |
| `ANON_KEY` | Default JWT | JWT signed with prod JWT_SECRET |
| `SERVICE_ROLE_KEY` | Default JWT | JWT signed with prod JWT_SECRET |
| `DASHBOARD_PASSWORD` | `supabase` | Strong password |
| `SUPABASE_PUBLIC_URL` | `http://localhost:8000` | `https://supabase.yourdomain.com` |
| `API_EXTERNAL_URL` | `http://localhost:8000` | `https://supabase.yourdomain.com` |
| `SITE_URL` | `http://localhost:3000` | `https://crm.yourdomain.com` |
| `ENABLE_EMAIL_AUTOCONFIRM` | `true` | `false` |
| `SMTP_HOST` | `supabase-mail` | Real SMTP provider |
| `DISABLE_SIGNUP` | `false` | `true` (if no public registration) |
| `NEXT_PUBLIC_DEMO_MODE` | `true` | `false` |
| `NEXT_PUBLIC_SUPABASE_URL` | `http://localhost:8000` | `https://supabase.yourdomain.com` |

---

## HTTPS Setup

OAuth providers **require** HTTPS. Two options:

### Option A: Caddy (Recommended — automatic TLS)

```env
# Add to .env
PROXY_DOMAIN=supabase.yourdomain.com
```

Comment out Kong's port bindings in `docker-compose.yml` if the proxy is on the same machine.

```bash
# Download the Caddy overlay from official repo if not present:
# curl -o docker-compose.caddy.yml https://raw.githubusercontent.com/supabase/supabase/master/docker/docker-compose.caddy.yml

docker compose -f docker-compose.yml -f docker-compose.caddy.yml up -d
```

Caddy automatically provisions and renews Let's Encrypt certificates.

### Option B: Existing reverse proxy (Nginx/Traefik)

Proxy all traffic to Kong on port 8000. Critical requirements:

- WebSocket support on `/realtime/v1/` (Upgrade + Connection headers)
- Pass `X-Forwarded-For`, `X-Forwarded-Proto` headers
- Don't expose Kong's port publicly when behind a proxy

```nginx
server {
    listen 443 ssl;
    server_name supabase.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/supabase.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/supabase.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /realtime/v1/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Backups

Self-hosted Supabase has **no automated backups**. Set this up yourself.

### Database backup

```bash
# Manual
docker exec supabase-db pg_dump -U postgres --format=custom --compress=9 postgres \
  > backup-$(date +%Y%m%d).dump

# Or use the built-in task
task db:backup
```

### Storage backup

```bash
tar czf storage-$(date +%Y%m%d).tar.gz docker/volumes/storage/
```

### Automated (cron)

```bash
# Add to crontab: crontab -e
0 3 * * * cd /opt/phpro-crm && docker exec supabase-db pg_dump -U postgres -Fc postgres > supabase/backups/db-$(date +\%Y\%m\%d).dump
0 3 * * * cd /opt/phpro-crm && tar czf supabase/backups/storage-$(date +\%Y\%m\%d).tar.gz docker/volumes/storage/
0 4 * * * find /opt/phpro-crm/supabase/backups -mtime +14 -delete
```

### Restore

```bash
docker exec -i supabase-db pg_restore -U postgres -d postgres --clean < backup.dump
```

---

## Updating

```bash
# Pull latest images
docker compose pull

# Restart (brief downtime)
docker compose down
docker compose up -d

# Verify
docker compose ps   # all should show "healthy"
```

Check the [changelog](https://github.com/supabase/supabase/blob/master/docker/CHANGELOG.md) before updating.

**Warning:** Changing `JWT_SECRET` invalidates ALL sessions and API keys. This requires regenerating `ANON_KEY`, `SERVICE_ROLE_KEY`, and updating every client app.

---

## Troubleshooting

### Container won't start

```bash
docker compose logs <service-name>     # e.g., docker compose logs auth
```

### Database connection issues

```bash
# Check DB is healthy
docker compose exec db pg_isready -U postgres

# Direct psql access
task db:psql
```

### Auth service not starting

Usually a bad `POSTGRES_PASSWORD` (special characters) or missing `JWT_SECRET`.

```bash
docker compose logs auth | head -20
```

### Studio shows infinite loading

Some Studio pages (OAuth Apps, Sessions, Email Templates) don't work in self-hosted Studio. This is a known Supabase limitation — configure these features via `.env` variables instead.

### Realtime not connecting

Check WebSocket route in Kong. If behind a reverse proxy, ensure `Upgrade` and `Connection` headers are passed through on `/realtime/v1/`.

### `VAULT_ENC_KEY` errors

Must be **exactly** 32 characters. Not 31, not 33. Generate with `openssl rand -hex 16`.

### macOS: Storage file permission errors

In Docker Desktop → Preferences → General, set file sharing to `VirtioFS`.

---

## Security Checklist (Production)

```
[ ] ALL default secrets replaced
[ ] ANON_KEY and SERVICE_ROLE_KEY regenerated with new JWT_SECRET
[ ] ENABLE_EMAIL_AUTOCONFIRM=false
[ ] HTTPS configured and working
[ ] Kong port (8000) NOT exposed publicly (only via reverse proxy)
[ ] Postgres port (5432) NOT exposed publicly
[ ] DASHBOARD_PASSWORD is strong (with letters)
[ ] .env is NOT committed to git
[ ] SERVICE_ROLE_KEY never exposed client-side
[ ] Backup cron job running and tested
[ ] DISABLE_SIGNUP=true (if no public registration needed)
[ ] DOCKER_SOCKET_LOCATION correct for your OS
```
