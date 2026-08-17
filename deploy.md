# Deploy Guide

Wrap Lab — Next.js 16 food-ordering app on **Vercel** + **PostgreSQL (Supabase)** via Prisma 6.

## Architecture

- **App**: Next.js 16 (App Router) — API routes in `src/app/api/*`
- **DB**: Supabase Postgres via Prisma (connection through the **session pooler** — the direct `db.<ref>.supabase.co` host requires IPv6 and won't resolve from most networks)
- **Auth**: HTTP-only cookie sessions stored in a `Session` table (serverless-safe)
- **Migrations**: committed in `prisma/migrations/` and applied with `prisma migrate deploy`

## 1. Environment variables

```env
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_APP_URL="https://<your-domain>"
NEXT_PUBLIC_APP_NAME="Wrap Lab"
NEXT_PUBLIC_LOCATION="Islamabad, Pakistan"
NEXT_PUBLIC_PHONE="03127777067"
NEXT_PUBLIC_EMAIL="wraplab.pk@gmail.com"
AUTH_SECRET="<openssl rand -hex 32>"
SESSION_MAX_AGE="604800"
DELIVERY_FEE="150"
FREE_DELIVERY_THRESHOLD="1500"
```

`DATABASE_URL` and `AUTH_SECRET` are secrets — set them in the platform's env settings, never commit them.

## 2. Provisioning the database (Supabase)

1. Create a project in the Supabase dashboard.
2. **Project Settings → Database → Connection string** → copy the **pooler** URI (port 5432 session mode).
3. Replace `[YOUR-PASSWORD]` with the database password.

## 3. Applying migrations

```sh
npx prisma migrate deploy   # applies prisma/migrations/* to production
npx prisma migrate dev      # local development (creates new migrations)
npx tsx prisma/seed.ts      # seed categories, products, offers, admin
```

`migrate deploy` is the correct command for CI/CD — it never prompts.

## 4. Deploying the app (Vercel)

```sh
vercel link
vercel env add DATABASE_URL production
vercel env add AUTH_SECRET production
vercel deploy --prod
```

Build command: `prisma generate && next build` (already the `build` script). The Prisma Client is generated during the build; the DB schema must be migrated before (or during) deploy.

## 5. Post-deploy checks

```sh
npx prisma migrate status
curl https://<your-domain>/api/categories   # expect 9 seeded categories
curl https://<your-domain>/api/products     # expect 12 seeded products
```

## Admin account (seeded)

- Email: `admin@wraplab.pk` / Password: `admin123`

---

## Multi-Tenant SaaS

The app is now a multi-tenant platform ("OrderHub"). Every restaurant gets its own sub-path storefront and admin dashboard; all data is scoped per tenant in a single Postgres database.

### URL scheme

| Path | Purpose |
|------|---------|
| `/` | Platform landing with tenant directory (from `GET /api/tenant`) |
| `/{slug}` | Tenant storefront, e.g. `/wraplab`, `/shawarma-palace` |
| `/{slug}/api/*` | Tenant-scoped APIs; middleware (`src/middleware.ts`) rewrites to `/api/*` and forwards the slug via the `x-tenant-slug` header |
| `/admin` | Admin dashboard (login required; APIs under `/api/admin/*` are session-scoped) |
| `/signup` | Self-serve tenant signup → `POST /api/signup` creates Tenant + admin User + starter Category and logs the owner in |

### Seeded demo tenants

Both are created by `prisma/seed.ts` (run `npx tsx prisma/seed.ts` after `prisma migrate deploy`). See the seed file for credentials:

- **Wrap Lab** — slug `wraplab` — 9 categories / 12 products / 3 offers — admin `admin@wraplab.pk`
- **Shawarma Palace** — slug `shawarma-palace` — 3 categories / 5 products / 2 offers — admin `admin@shawarmapalace.pk`

### Creating a tenant

1. Visit `/signup` (or `POST /api/signup` with `restaurantName`, `slug`, `name`, `email`, `password`).
2. The tenant gets a storefront at `/{slug}` immediately.
3. Log in at `/admin` with the new admin account to manage categories, products, offers, orders, and settings (per-tenant branding, fees, contact).

### Migration note

Migration `20260817191548_add_tenants` introduces the `Tenant` model and `tenantId` FK on all tenant-owned tables. Apply with:

```sh
npx prisma migrate deploy
```

### Production env vars (current set)

Only these are set on Vercel production — the app reads nothing else (per-tenant branding/fees come from the `Tenant` table, not `NEXT_PUBLIC_*`):

```env
DATABASE_URL   # Supabase pooler URI
AUTH_SECRET    # random secret
SESSION_MAX_AGE
```