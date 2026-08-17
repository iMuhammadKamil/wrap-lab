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