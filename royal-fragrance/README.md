# Royal Fragrance

Premium perfume e-commerce & vendor management platform.

This is **Phase 1** of the build: project scaffold, brand design system,
full landing page, site architecture (all routes stubbed), and the complete
database schema. It's built to run in a GitHub Codespace and deploy to
Netlify, on the stack you already use: **Next.js 14 (App Router) + TypeScript
+ Tailwind + Supabase**.

## What's included in this drop

- Next.js 14 App Router project, TypeScript, Tailwind configured with the
  Royal Fragrance brown palette (`tailwind.config.ts`)
- Fully built **home page** — Hero, Brand Intro, Featured Products, Future
  Vision, Why Choose Us, Become a Vendor, Testimonials (data-driven, no fake
  reviews), Newsletter, Navbar, Footer
- Route scaffold for every page in the spec: `/shop`, `/product/[slug]`,
  `/cart`, `/checkout`, `/order-confirmation`, `/about`, `/future`,
  `/become-a-vendor`, `/login`, `/register`, `/account`, `/vendor`, `/admin`
  (each currently a placeholder — ready for you to build out next)
- **Complete database schema** (`supabase/schema.sql`) covering users,
  vendors, products/variants, orders, delivery zones, vendor collection
  accounts, payment transactions, vendor sales + sale items, vendor
  inventory + inventory movements, product handovers, testimonials,
  newsletter, and audit logs — with RLS enabled and a starter policy set
- Supabase client setup for browser, server (App Router), and admin
  (service-role, server-only)

## What's intentionally NOT built yet

Per the spec's own guidance ("do not unnecessarily build all future features
now, but the architecture should avoid making them difficult to add later"),
this drop does not yet include: cart/checkout logic, Paystack/Monnify
integration, auth flows, the vendor dashboard, or the admin dashboard. The
schema and folder structure are built to make all of those straightforward
next steps.

## Getting started in your Codespace

```bash
npm install
cp .env.example .env.local   # fill in your Supabase + payment keys
npm run dev
```

Then open the forwarded port (Codespaces will prompt you) to see the site.

## Setting up Supabase

1. Create a project at supabase.com.
2. Copy the Project URL and anon key into `.env.local`.
3. Run `supabase/schema.sql` in the Supabase SQL editor (or via the CLI:
   `supabase db push`) to create every table, enum, and RLS policy.
4. Regenerate types once the schema is live:
   ```bash
   npx supabase gen types typescript --project-id <your-project-id> > src/lib/types/database.ts
   ```

## Folder structure

```
src/
  app/            Next.js routes (App Router)
  components/
    layout/       Navbar, Footer
    home/         Landing page sections
    ui/           Button, ProductCard, shared primitives
  lib/
    supabase/     Browser / server / admin Supabase clients
    types/        Domain + generated DB types
    utils/        cn(), currency formatting
  data/           Temporary sample data (remove once DB is wired up)
supabase/
  schema.sql      Full database schema + RLS starter policies
```

## Suggested build order for Phase 2

1. Auth (Supabase Auth) — login/register, role-based middleware for
   `/vendor` and `/admin`.
2. Shop + product detail pages wired to the `products` table.
3. Cart (client state) → Checkout → Payment abstraction layer → Order
   confirmation.
4. Admin: product management, order management.
5. Vendor: collection account display, transactions, sale recording,
   inventory, handovers.
6. Payment provider webhooks (server-side verified, idempotent) connecting
   transactions to orders and vendor collections.

Before implementing payment-provider-specific functionality, verify current
API capabilities, account eligibility, settlement rules, webhook security
requirements, and pricing directly against Paystack's or Monnify's official
documentation.
