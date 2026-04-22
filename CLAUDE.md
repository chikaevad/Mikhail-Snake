# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build (standalone output)
pnpm checks           # Run format:check + lint + types
pnpm pipeline         # Full CI: format:check, lint, types, audit, build
pnpm format           # Format code with Prettier
pnpm lint             # ESLint
pnpm types            # TypeScript type-check (tsc --noEmit)
pnpm db:generate      # Generate Drizzle migrations from schema
pnpm db:migrate       # Apply migrations
pnpm db:studio        # Open Drizzle Studio
```

No test framework is configured.

## Architecture

Next.js 16 full-stack app using App Router with `src/` directory. Package manager is pnpm. Path alias: `@/*` → `./src/*`.

### Route Groups

- `src/app/(app)/` — Protected routes. The layout calls `getValidSession()` which redirects to `/login` if unauthenticated.
- `src/app/(auth)/` — Auth pages (login, register, logout). Login/register are public; logout requires a session.
- `src/app/api/auth/[...all]/` — Better Auth catch-all handler.

### Auth (`src/auth/`)

- **better-auth** with email/password (email verification required, auto sign-in disabled).
- Server: `src/auth/index.ts` exports the `auth` instance. Client: `src/auth/client.ts` exports `authClient`.
- Utilities in `src/auth/utils.ts`: `getMaybeSession()`, `getValidSession()`, `getUser()` — all server-side, using `headers()`.
- `nextCookies()` plugin must be last in the plugins array.

### Database (`src/db/`)

- **Drizzle ORM** with PostgreSQL (`pg` driver, connection pool max 12).
- Casing: `snake_case` (configured in drizzle instance).
- Schemas: `src/db/schema/auth.ts` (user_entity, session, account, verification), `src/db/schema/app.ts` (app tables go here).
- Query functions in `src/db/functions/`. Migrations output to `src/db/migrations/`.
- Drizzle config at `src/db/drizzle.config.ts`. The pool is stored globally in dev to survive hot reloads.

### Environment (`src/env/index.ts`)

- Type-safe env via `@t3-oss/env-nextjs`. Server vars: `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`.

### Styling

- Tailwind CSS 4 with oklch color tokens in `src/app/globals.css`. Dark mode via `next-themes` (class strategy).
- shadcn/ui (New York style) components in `src/components/ui/`. Config in `components.json`.
- `cn()` utility at `src/utils/tailwind.ts` (clsx + tailwind-merge).

### Forms

- react-hook-form + Zod for validation. See login/register forms for the pattern.

### Key Conventions

- Server Components by default; client components use `'use client'`.
- TypeScript strict mode with `noUncheckedIndexedAccess`.
- `next build` ignores TS errors (caught by `pnpm types` in CI instead).
- `output: 'standalone'` in next.config.ts for Docker deployments.
- Local Postgres via Docker Compose (`pgvector/pgvector:0.8.1-pg17` on port 5432).

### Coding Standards

- No cascade deletes on database tables. We use a `db.transaction()` where we execute each query needed.
