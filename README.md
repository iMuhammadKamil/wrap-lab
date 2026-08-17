# Wrap Lab - Full-Stack Food Ordering App

A full-stack clone of [wraplab.pk](https://wraplab.pk/) built with **Next.js 16**, **Prisma ORM**, **PostgreSQL (Supabase)**, and **Tailwind CSS 4**. Features working cart, checkout, authentication, discount codes, and order management.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?logo=postgresql)

---

## Features

- **Responsive UI** - Mobile-first design matching wraplab.pk with dark theme (#333) and gold accents (#d7b51a)
- **Product Catalog** - 9 categories, 12+ products with images, badges, ratings, and add-ons
- **Search & Filter** - Real-time search and category-based filtering
- **Cart System** - Guest and authenticated cart support with quantity controls, add-ons selection, and backend sync
- **Authentication** - Session-based auth (HTTP-only cookies) with bcrypt password hashing
- **Checkout** - Full checkout flow with address, notes, discount code validation, and order placement
- **Discount Codes** - 3 pre-seeded offers: `FREEDEL` (free delivery), `FAMILY20` (20% off), `WELCOME15` (15% off)
- **Order Management** - Auto-generated order numbers (WL-XXXXXXXX-XXX), order history tracking
- **WhatsApp Integration** - Floating WhatsApp button for customer support
- **Admin Seed** - Pre-seeded admin account for future admin panel development

---

## Tech Stack

| Layer       | Technology                            |
|-------------|---------------------------------------|
| Frontend    | Next.js 16 (App Router), React 19     |
| Styling     | Tailwind CSS 4, Framer Motion         |
| State       | Zustand (client-side cart)            |
| Backend     | Next.js API Routes (11 endpoints)     |
| Database    | PostgreSQL (Supabase) via Prisma ORM  |
| Auth        | DB-backed session cookies, bcryptjs   |
| Runtime     | Node.js                               |

---

## Project Structure

```
wrap-lab/
├── prisma/
│   ├── schema.prisma        # 7 DB models
│   ├── seed.ts             # Seeding script (categories, products, offers, admin)
│   └── db/                 # SQLite database (git-ignored)
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main page (all UI components)
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── register/route.ts
│   │       │   ├── login/route.ts
│   │       │   ├── me/route.ts
│   │       │   └── logout/route.ts
│   │       ├── products/route.ts       # GET ?category= & ?search=
│   │       ├── products/[id]/route.ts  # GET single + related
│   │       ├── categories/route.ts    # GET with product counts
│   │       ├── cart/route.ts           # GET list, POST add
│   │       ├── cart/[id]/route.ts     # PUT update qty, DELETE remove
│   │       ├── orders/route.ts        # POST create, GET user orders
│   │       └── offers/route.ts        # GET list, POST validate code
│   └── lib/
│       ├── auth.ts           # Auth helpers (hash, verify, sessions)
│       ├── db.ts             # Prisma client singleton
│       └── cart-store.ts     # Zustand cart store
├── public/                  # Static assets
├── .env.example            # Environment variables template
└── package.json
```

---

## Database Schema

7 models: **User**, **Category**, **Product**, **ProductAddon**, **CartItem**, **Order**, **OrderItem**, **Offer**

- Cart and Orders support both authenticated users and guest sessions (no FK constraint on userId)
- Prices stored in **PKR (Rs.)**
- Order numbers auto-generated as `WL-YYYYMMDD-NNN`

---

## Getting Started

### Prerequisites

- **Node.js** 20+ (npm 10+)
- A **PostgreSQL** database (e.g. Supabase) with a `DATABASE_URL` connection string

### Installation

```bash
# Clone the repository
git clone https://github.com/iMuhammadKamil/wrap-lab.git
cd wrap-lab

# Install dependencies
npm install

# Copy environment file and set DATABASE_URL to your Postgres (Supabase pooler) URI
cp .env.example .env.local

# Set up database
npx prisma migrate deploy
npx prisma generate

# Seed the database (categories, products, offers, admin user)
npx tsx prisma/seed.ts

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Endpoints

| Method | Endpoint                  | Description                  |
|--------|---------------------------|------------------------------|
| POST   | `/api/auth/register`      | Register a new user          |
| POST   | `/api/auth/login`         | Login and create session     |
| GET    | `/api/auth/me`            | Get current logged-in user   |
| POST   | `/api/auth/logout`        | Destroy session              |
| GET    | `/api/categories`         | List categories with counts  |
| GET    | `/api/products`           | List products (`?category=` `?search=`) |
| GET    | `/api/products/:id`       | Single product + related     |
| GET    | `/api/cart`               | List cart items              |
| POST   | `/api/cart`               | Add/update item in cart      |
| PUT    | `/api/cart/:id`           | Update item quantity         |
| DELETE | `/api/cart/:id`           | Remove item from cart        |
| GET    | `/api/orders`             | List user orders             |
| POST   | `/api/orders`             | Place order                  |
| GET    | `/api/offers`             | List active offers           |
| POST   | `/api/offers`             | Validate discount code       |

---

## Default Seed Data

### Discount Codes

| Code       | Type           | Value | Min Order |
|------------|----------------|-------|-----------|
| `FREEDEL`  | Free Delivery  | -     | Rs. 0     |
| `FAMILY20` | 20% Off        | 20%   | Rs. 1000  |
| `WELCOME15`| 15% Off        | 15%   | Rs. 500   |

### Admin Account

- **Email:** `admin@wraplab.pk`
- **Password:** `admin123`

---

## Available Scripts

```bash
npm run dev          # Start dev server on port 3000
npm run build        # Build for production (standalone output)
npm run start        # Run production server
npm run lint         # Run ESLint
npm run db:push      # Push schema to database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
db:reset          # Reset database
```

---

## Deployment

Deployed on **Vercel** with a **Supabase PostgreSQL** database. Key environment variables:

```env
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
AUTH_SECRET="your-random-secret"
NODE_ENV="production"
```

Build runs `prisma generate && next build`; run `npx prisma migrate deploy` to apply schema changes to production.

---

## License

This project is for educational purposes. All product images and branding belong to [Wrap Lab](https://wraplab.pk/).
