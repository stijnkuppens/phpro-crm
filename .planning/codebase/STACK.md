# Technology Stack

**Analysis Date:** 2026-03-20

## Languages

**Primary:**
- TypeScript 5.9.3 - Full codebase (strict mode enabled)

**Secondary:**
- JavaScript (configuration files: ESLint, Next.js config)

## Runtime

**Environment:**
- Node.js (unspecified version, inferred from Next.js 16 compatibility)

**Package Manager:**
- npm (Lockfile: package-lock.json implied, not verified)

## Frameworks

**Core:**
- Next.js 16.1.6 - App Router with Turbopack, SSR/SSG rendering
- React 19.2.4 - Component framework

**UI & Styling:**
- Tailwind CSS 4.2.1 - Utility-first CSS framework with v4 `@tailwindcss/postcss`
- shadcn/ui 4.0.5 - Headless UI component library (uses `tailwindcss` and `class-variance-authority`)
- Lucide React 0.577.0 - Icon library

**Forms & Validation:**
- React Hook Form 7.71.2 - Form state management
- Zod 4.3.6 - Runtime schema validation
- @hookform/resolvers 5.2.2 - RHF + Zod integration

**Internationalization:**
- next-intl 4.8.3 - Multi-language support (nl, en)

**Animation & Interaction:**
- Framer Motion 12.36.0 - Motion library for React
- dnd-kit (6.3.1) - Drag-and-drop: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- tw-animate-css 1.4.0 - Tailwind animation utilities

**Data Table:**
- @tanstack/react-table 8.21.3 - Headless table library

**Editor & Content:**
- @udecode/plate 49.0.0 - Rich text editor (Plate)
- react-image-crop 11.0.10 - Image cropping utility

**UI Components & Utilities:**
- cmdk 1.1.1 - Command palette/menu
- react-day-picker 9.14.0 - Calendar date picker
- sonner 2.0.7 - Toast notifications
- clsx 2.1.1 - Conditional className utility
- tailwind-merge 3.5.0 - Merge Tailwind classes without conflicts
- @base-ui/react 1.2.0 - Unstyled, accessible base components
- next-themes 0.4.6 - Theme management (dark/light, brand themes)

**Build & Development:**
- TypeScript 5.9.3 - Language compiler
- ESLint 9.39.4 - Code linting
- eslint-config-next 16.1.6 - Next.js ESLint config
- @eslint/eslintrc 3.3.5 - ESLint configuration
- tsx 4.21.0 - TypeScript executor for Node.js scripts
- PostCSS 8.5.8 - CSS transformation
- @tailwindcss/postcss 4.2.1 - Tailwind PostCSS plugin

**Type Definitions:**
- @types/node 25.4.0 - Node.js types
- @types/react 19.2.14 - React types
- @types/react-dom 19.2.3 - React DOM types

## Key Dependencies

**Critical:**
- @supabase/ssr 0.9.0 - Server-side rendering support for Supabase auth (cookie management)
- @supabase/supabase-js 2.99.1 - Supabase JavaScript client (CRUD, auth, real-time subscriptions)
- date-fns 4.1.0 - Date utility library

**Infrastructure:**
- class-variance-authority 0.7.1 - Component variant system (shadcn foundation)

## Configuration

**Environment:**
- Environment variables validated via Zod in `src/lib/env.ts`
- Client-side public vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server-side secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WEBHOOK_SECRET`
- Local development: Docker Compose `.env` specifies Supabase ports, JWT secrets, SMTP settings
- See `.env.example` for complete variable list

**Build:**
- `next.config.ts` - Next.js configuration:
  - `output: 'standalone'` for Docker deployments
  - Security headers: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
  - CSP includes Supabase URL, fonts.gstatic.com (Google Fonts), blob: and data: for images
  - next-intl plugin for i18n routing
- `tsconfig.json` - TypeScript strict mode, path alias `@/*` → `./src/*`
- `postcss.config.mjs` - PostCSS with @tailwindcss/postcss
- `eslint.config.mjs` - ESLint configuration

## Platform Requirements

**Development:**
- Node.js runtime (implied via Next.js 16 compatibility)
- Docker Compose for local Supabase stack (5+ services: db, auth, rest, realtime, storage, imgproxy, meta, kong, studio)
- PostgreSQL 15.8.1 (via Supabase Docker image)

**Production:**
- Docker container (standalone Next.js build)
- Self-hosted Supabase instance or Supabase Cloud
- Kong API gateway (port 8000 in Docker setup)

---

*Stack analysis: 2026-03-20*
