# Deploy Guide

This project is a Prisma 7 (PostgreSQL) workspace. Deploying means:

1. Provisioning a production PostgreSQL database
2. Setting `DATABASE_URL` in your host's environment
3. Applying schema migrations
4. Shipping the app that consumes `@prisma/client`

## Prerequisites

- Node.js 18+ and npm
- A PostgreSQL database (managed or self-hosted)
- `DATABASE_URL` in your environment (see `.env` locally; it is gitignored)

## 1. Local setup

```sh
npm install
npx prisma generate
npx prisma migrate dev --name init   # only for local development
```

## 2. Production database

Provision Postgres on any provider (Neon, Supabase, Railway, RDS, DigitalOcean, Prisma Postgres, ...) and create a database:

```sql
CREATE DATABASE wrap_lab;
```

## 3. Apply migrations to production

With `DATABASE_URL` set to the production connection string:

```sh
npx prisma migrate deploy
```

`migrate deploy` applies the committed migrations in `prisma/migrations` without prompting — it is the correct command for CI/CD.

## 4. Deploy the app

This workspace currently contains only the Prisma layer. Deploy the application that uses it, e.g.:

| Host        | Notes |
|-------------|-------|
| Railway     | Set `DATABASE_URL`, build: `npm install && npx prisma generate`, start: your app command |
| Render      | Same pattern via render.yaml / dashboard |
| Vercel      | Set `DATABASE_URL` in project env vars; run `npx prisma migrate deploy` in the build step |
| Fly.io      | Set env vars with `fly secrets set DATABASE_URL=...` |
| Prisma Postgres | Managed Postgres + Prisma Accelerate; use the pooled connection string |

The generated Prisma Client is created with:

```sh
npx prisma generate
```

Never commit `.env`; every environment needs its own `DATABASE_URL`.

## 5. Post-deploy checks

```sh
npx prisma migrate status   # confirms all migrations are applied
npx prisma studio           # inspect data (dev only, never expose publicly)
```