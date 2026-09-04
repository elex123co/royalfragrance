# Royal Fragrance

Premium perfume e-commerce & vendor management platform.

Built to run in a GitHub Codespace and deploy to Netlify, on the stack you
already use: **Next.js 14 (App Router) + TypeScript + Tailwind + Supabase +
Paystack**.

## What's included

**Brand & storefront**
- Tailwind configured with the Royal Fragrance brown palette (`tailwind.config.ts`)
- Full home page — Hero, Brand Intro, Featured Products, Future Vision, Why
  Choose Us, Become a Vendor, Testimonials (data-driven, no fake reviews),
  Newsletter, Navbar (with live cart badge), Footer
- Shop page with search, category filter, and sort, reading from Supabase
  with a sample-data fallback so the site renders before the DB is seeded
- Product detail page with variant selection, add-to-cart / buy-now
- Cart (React Context + localStorage persistence)
- 3-step checkout → order created server-side → Paystack redirect
- Order confirmation page with live payment-status fallback verification

**Payments**
- Full provider abstraction (`src/lib/payments/`) — Paystack fully
  implemented (initialize, verify, webhook signature check, dedicated
  virtual accounts); Monnify stubbed to the same interface so switching
  `PAYMENT_PROVIDER` is the only change needed later
- Paystack webhook handler (`/api/webhooks/paystack`) — verifies signature
  server-side, prevents duplicate transactions, marks orders paid

**Auth & accounts**
- Login / register via Supabase Auth
- `middleware.ts` — role-based route protection for `/vendor` and `/admin`
- Postgres trigger in `schema.sql` that auto-provisions the `users` /
  `customers` row on signup
- Vendor application flow (`/become-a-vendor`) — creates the account and a
  `pending_approval` vendor row for admin review
- Customer account page — profile + real order history

**Admin dashboard** (`/admin`)
- Overview — live revenue, orders, customers, vendors, low stock, pending
  handovers, recent orders
- Products — full CRUD with variants, category, images, status
- Orders — list with inline status updates
- Vendors — list with approve / suspend / reactivate, and a vendor detail
  page for assigning inventory

**Vendor dashboard** (`/vendor`)
- Overview — collections (today/month/total), pending sale records, pending
  handovers, inventory summary
- Collection account — bank/account display with copy & share
- Transactions — confirmed collections, flagged as unrecorded until matched
  to a sale
- Record Sale — connects a payment to specific products, deducts inventory,
  flags amount mismatches for review instead of hiding them
- Sales — history with fulfillment status
- Inventory — current stock with low-stock flagging
- Handovers — record and review product handovers

**Database**
- Complete schema (`supabase/schema.sql`) — users, vendors, products/
  variants, orders, delivery zones, vendor collection accounts, payment
  transactions, vendor sales + items, vendor inventory + movements, product
  handovers, testimonials, newsletter, audit logs — with RLS enabled and a
  starter policy set, plus the signup trigger mentioned above

## What's intentionally not built yet

- Monnify's actual API integration (structural stub only — implement against
  their current docs before switching `PAYMENT_PROVIDER=monnify`)
- Email/SMS/WhatsApp notification delivery (the schema and audit log support
  it; only in-app state changes are wired up)
- Discount codes, gift cards, loyalty programs, multi-warehouse — all called
  out in the spec as deliberate future expansion, not needed now

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

## Setting up Paystack

1. Get your test secret key from the Paystack dashboard → put it in
   `PAYSTACK_SECRET_KEY`.
2. In the Paystack dashboard, add a webhook URL pointing to
   `https://<your-domain>/api/webhooks/paystack` (use `ngrok` or a Codespaces
   forwarded URL for local testing).
3. Dedicated Virtual Accounts (vendor collection accounts) require
   additional business KYC approval from Paystack — the
   `createVendorCollectionAccount` call in `src/lib/payments/paystack.ts`
   will fail gracefully until that's approved; vendors can still be
   approved and sell without one.

## Folder structure

```
src/
  app/
    (public)      shop, product, cart, checkout, order-confirmation,
                   about, future, become-a-vendor, login, register, account
    admin/         Admin dashboard — overview, products, orders, vendors
    vendor/        Vendor dashboard — overview, collection account,
                   transactions, sales, inventory, handovers
    api/           checkout, webhooks/paystack, newsletter
  components/
    layout/        Navbar, Footer
    home/           Landing page sections
    shop/           Shop filters, product purchase panel
    checkout/       Checkout form
    admin/          Admin-only UI (product form, row actions)
    vendor/         Vendor-only UI (record sale, handover, collection account)
    ui/             Button, ProductCard, shared primitives
  lib/
    supabase/       Browser / server / admin Supabase clients
    payments/       Payment provider abstraction (Paystack, Monnify)
    actions/         Server actions (products, orders, vendors, sales, handovers)
    data/            Server-side data fetchers (products, delivery, vendor, categories)
    types/           Domain + generated DB types
    utils/           cn(), currency formatting
  context/          CartContext
  data/             Temporary sample data (used as fallback until DB is seeded)
supabase/
  schema.sql        Full database schema, RLS policies, and signup trigger
```

## Suggested next steps

1. Seed `categories` and a few `products` in Supabase so the shop shows real
   data instead of the sample fallback.
2. Set up the Paystack webhook (above) and test a full checkout end to end.
3. Create an admin user manually (set `role = 'admin'` on a `users` row) and
   confirm the admin dashboard, then approve a test vendor application.
4. Add email/SMS notifications on the events already logged to
   `audit_logs` (payment confirmed, sale recorded, handover completed).
5. Before going live with Monnify, implement it against their current API
   docs — the interface in `src/lib/payments/types.ts` is what it needs to
   satisfy.
