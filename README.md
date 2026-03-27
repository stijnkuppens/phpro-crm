# PHPro CRM

Internal CRM built with Next.js 16, React 19, Supabase, and Tailwind CSS.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start Supabase (Docker Compose)
docker compose up -d

# 3. Wait for services to be healthy (~60s)
docker compose ps

# 4. Apply database migrations + seed data
task db:migrate
task db:data
task db:fixtures

# 5. Start Next.js
npm run dev
```

Open http://localhost:3000 for the app, http://localhost:8000 for Supabase Studio (`supabase` / `supabase`).

## Prerequisites

- [Docker Desktop](https://docs.docker.com/desktop/) (or Docker Engine + Compose on Linux)
- [Node.js](https://nodejs.org/) 20+
- [Task](https://taskfile.dev/) runner — `brew install go-task`

## Access

| Service | URL | Credentials |
|---------|-----|-------------|
| App | http://localhost:3000 | See demo users below |
| Supabase Studio | http://localhost:8000 | `supabase` / `supabase` |
| Supabase API | http://localhost:8000/rest/v1/ | Pass `apikey` header |
| Database (session) | `localhost:54322` | `postgres` / (see .env) |
| Database (pooled) | `localhost:6543` | `postgres.phpro-crm` / (see .env) |

### Demo Users

| Email | Password | Role |
|-------|----------|------|
| `admin@example.com` | `admin123456` | `admin` |
| `manager@example.com` | `manager123456` | `sales_manager` |
| `marketing@example.com` | `marketing123456` | `marketing` |

## Commands

Run `task --list` for all commands.

| Command | Description |
|---------|-------------|
| `task dev` | Start Supabase + Next.js |
| `task dev:stop` | Stop Supabase |
| `task dev:restart` | Restart Supabase |
| `task dev:logs` | Tail container logs |
| `task dev:studio` | Open Studio in browser |
| `task db:migrate` | Apply pending migrations |
| `task db:reset` | Full rebuild (destroys data) |
| `task db:new-migration -- <name>` | Create a new migration file |
| `task db:data` | Apply production data |
| `task db:fixtures` | Load demo fixtures |
| `task db:psql` | Open psql shell |
| `task db:backup` | Backup database |
| `task db:restore -- <file>` | Restore from backup |
| `task types:generate` | Regenerate TypeScript types |
| `task build` | Production build |
| `task prod:up` | Start full prod stack (with Next.js in Docker) |

## Stack

- **Next.js 16** — App Router, Turbopack, Server Components
- **React 19** — Server-first data flow
- **Supabase** — Postgres, Auth (GoTrue), Storage, Realtime
- **Tailwind CSS v4** + **shadcn/ui** — Styling
- **TypeScript** — Strict mode

## Project Structure

```
src/
├── app/admin/          # Route pages (thin wrappers)
├── features/           # Feature modules (accounts, contacts, deals, ...)
│   └── <name>/
│       ├── actions/    # Server actions (mutations)
│       ├── queries/    # Server queries (React.cache)
│       ├── components/ # Client components
│       └── types.ts    # Zod schemas, types
├── components/         # Shared UI (admin, layout, shadcn/ui)
└── lib/                # Hooks, Supabase clients, utilities

supabase/
├── migrations/         # Schema migrations (DDL, RLS, grants)
├── data/               # Production seed data
└── fixtures/           # Demo data (dev/staging only)

docker/
├── volumes/            # Supabase service configs (Kong, DB init, Vector, Pooler)
└── nextjs/Dockerfile   # Production Next.js build
```

## Database Architecture

```
supabase/
  migrations/      # Schema only (DDL, triggers, RLS, grants)
  data/            # Production data (pipelines, indices, settings)
  fixtures/        # Demo data (fake users, sample accounts)
```

### Deploy pipeline

```
production:   migrations → data/
staging:      migrations → data/ → fixtures/
local dev:    docker compose up → db:migrate → db:data → db:fixtures
```

## Database Backups

Backups are stored in `supabase/backups/` (gitignored).

```bash
task db:backup                           # local
task db:restore -- supabase/backups/local_20260322_060000.sql.gz
```

## Documentation

- **[docs/DOCKER.md](docs/DOCKER.md)** — Full Docker setup, all environment variables, production deployment, HTTPS, OAuth, SMTP, backups, security checklist
- **[CLAUDE.md](CLAUDE.md)** — Architecture rules, coding conventions, feature module structure
