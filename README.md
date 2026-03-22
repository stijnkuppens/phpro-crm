# PHPro CRM

Next.js 16 + Supabase CRM application.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Docker](https://www.docker.com/) (for Supabase local dev)
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) (`npm i -g supabase` or `brew install supabase/tap/supabase`)
- [Task](https://taskfile.dev/) (`brew install go-task`)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env and fill in keys after step 3
cp .env.example .env

# 3. Start everything (Supabase + Next.js)
task dev
# On first run, paste the anon key and service_role key from the output into .env
```

## Access

| Service | URL |
|---------|-----|
| App | http://localhost:3000 |
| Supabase Studio | http://127.0.0.1:54323 |
| Supabase API | http://127.0.0.1:54321 |
| Database | postgresql://postgres:postgres@127.0.0.1:54322/postgres |
| Inbucket (email UI) | http://127.0.0.1:54324 |

### Demo Users

| Email | Password | Role |
|-------|----------|------|
| `admin@example.com` | `admin123456` | `admin` |
| `manager@example.com` | `manager123456` | `sales_manager` |
| `marketing@example.com` | `marketing123456` | `marketing` |

## Environment Variables

After `supabase start`, copy the output keys to `.env`:

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `supabase status` → API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `supabase status` → anon key |
| `SUPABASE_URL` | Same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | `supabase status` → service_role key |
| `NEXT_PUBLIC_APP_NAME` | Display name in the UI |
| `SMTP_HOST` / `SMTP_PORT` | Inbucket SMTP (default: localhost:54325) |

## Task Commands

Run `task --list` for all commands.

### Development

| Command | Description |
|---------|-------------|
| `task dev` | Start Supabase + Next.js dev server |
| `task dev:supabase` | Start Supabase only |
| `task dev:next` | Start Next.js only |
| `task dev:stop` | Stop Supabase |
| `task status` | Show Supabase URLs and keys |

### Database

| Command | Description |
|---------|-------------|
| `task db:reset` | Full rebuild: drop, migrate, seed |
| `task db:new-migration -- <name>` | Create a new numbered migration file |
| `task db:data` | Apply production data only |
| `task db:fixtures` | Load demo fixtures only |
| `task db:studio` | Open Supabase Studio in browser |

### Code

| Command | Description |
|---------|-------------|
| `task types:generate` | Generate TypeScript types from the DB schema |
| `task entity:new -- <name>` | Scaffold a new entity |
| `task lint` | Run ESLint |
| `task typecheck` | Run TypeScript type checking |
| `task build` | Build the Next.js application |

### Production

| Command | Description |
|---------|-------------|
| `task prod:up` | Start production stack (Docker Compose) |
| `task prod:down` | Stop production stack |

## Database Architecture

```
supabase/
  config.toml      # Supabase CLI configuration
  migrations/      # Schema only (DDL, triggers, RLS, grants)
  data/            # Production data (pipelines, indices, settings)
  fixtures/        # Demo data (fake users, sample accounts)
```

Seeding is configured in `config.toml` — runs `data/*.sql` then `fixtures/*.sql` on `supabase db reset`.

### Deploy pipeline

```
production:   migrations → data/
staging:      migrations → data/ → fixtures/
local dev:    supabase db reset (all of the above)
```
