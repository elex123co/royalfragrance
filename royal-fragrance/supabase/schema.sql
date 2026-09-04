-- ============================================================================
-- ROYAL FRAGRANCE — DATABASE SCHEMA
-- Target: PostgreSQL (Supabase)
-- Apply with: supabase db push   OR   run in the Supabase SQL editor
-- ============================================================================
-- Conventions:
--   - All primary keys are uuid, default gen_random_uuid()
--   - Money columns store the smallest currency unit is NOT used here —
--     amounts are stored as numeric(12,2) in Naira for readability. Adjust
--     to kobo-integers if you prefer fixed-point exactness.
--   - created_at / updated_at are timestamptz, defaulting to now()
--   - Row Level Security (RLS) is enabled on every table; policies are
--     sketched at the bottom and MUST be reviewed before production use.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- ENUM TYPES
-- ----------------------------------------------------------------------------
create type user_role as enum ('customer', 'vendor', 'admin');
create type vendor_status as enum ('pending_approval', 'active', 'suspended', 'inactive');
create type product_status as enum ('active', 'draft', 'out_of_stock');
create type order_payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type order_status as enum (
  'order_received', 'payment_confirmed', 'processing',
  'ready_for_delivery', 'out_for_delivery', 'delivered', 'cancelled'
);
create type payment_provider as enum ('paystack', 'monnify');
create type transaction_status as enum ('confirmed', 'pending', 'failed', 'under_review');
create type sale_status as enum ('amount_matches', 'partial_recorded', 'value_mismatch', 'requires_review');
create type fulfillment_status as enum (
  'pending_handover', 'ready_for_delivery', 'out_for_delivery',
  'handed_over', 'delivered', 'cancelled', 'returned'
);
create type handover_method as enum (
  'personal_delivery', 'customer_pickup', 'courier_delivery',
  'transfer_to_vendor', 'transfer_to_location'
);
create type movement_type as enum (
  'stock_assigned', 'stock_received', 'sale_recorded',
  'product_returned', 'stock_adjustment', 'damaged_product'
);

-- ----------------------------------------------------------------------------
-- USERS  (mirrors auth.users; one row per Supabase auth user)
-- ----------------------------------------------------------------------------
create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  phone text,
  role user_role not null default 'customer',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table customers (
  user_id uuid primary key references users (id) on delete cascade,
  default_address text,
  created_at timestamptz not null default now()
);

create table vendors (
  user_id uuid primary key references users (id) on delete cascade,
  vendor_code text not null unique,           -- short human-friendly id, e.g. VEND-0042
  business_name text not null,
  status vendor_status not null default 'pending_approval',
  onboarding_notes text,
  approved_at timestamptz,
  approved_by uuid references users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- CATALOG
-- ----------------------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  short_description text,
  category_id uuid references categories (id),
  base_price numeric(12,2) not null default 0,
  fragrance_notes jsonb,              -- { top: [], heart: [], base: [] }
  status product_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  url text not null,
  position int not null default 0
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  size text not null,                 -- e.g. "50ml"
  price numeric(12,2) not null,
  stock int not null default 0 check (stock >= 0),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- DELIVERY
-- ----------------------------------------------------------------------------
create table delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,                 -- e.g. "Lagos", "Zone A"
  state text,
  city text,
  fee numeric(12,2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ORDERS  (customer-facing e-commerce checkout)
-- ----------------------------------------------------------------------------
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,  -- human-friendly, e.g. RF-100234
  customer_id uuid references customers (user_id),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  delivery_state text not null,
  delivery_city text not null,
  delivery_address text not null,
  delivery_zone_id uuid references delivery_zones (id),
  delivery_fee numeric(12,2) not null default 0,   -- snapshot at time of order
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  payment_status order_payment_status not null default 'pending',
  order_status order_status not null default 'order_received',
  payment_provider payment_provider,
  provider_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid not null references products (id),
  variant_id uuid references product_variants (id),
  quantity int not null check (quantity > 0),
  unit_price numeric(12,2) not null   -- snapshot at time of order
);

-- ----------------------------------------------------------------------------
-- VENDOR COLLECTION ACCOUNTS
-- ----------------------------------------------------------------------------
create table vendor_collection_accounts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors (user_id) on delete cascade,
  provider payment_provider not null,
  provider_account_reference text not null,   -- provider's internal id for this account
  bank_name text,
  account_number text,
  account_name text,
  status text not null default 'active',      -- active | pending | disabled
  created_at timestamptz not null default now(),
  unique (provider, provider_account_reference)
);

-- ----------------------------------------------------------------------------
-- PAYMENT TRANSACTIONS  (both customer order payments and vendor collections)
-- ----------------------------------------------------------------------------
create table payment_transactions (
  id uuid primary key default gen_random_uuid(),
  provider payment_provider not null,
  provider_transaction_reference text not null,   -- used for idempotency/dedupe
  vendor_id uuid references vendors (user_id),
  order_id uuid references orders (id),
  amount numeric(12,2) not null,
  status transaction_status not null default 'pending',
  payer_name text,
  payer_phone text,
  raw_payload jsonb,                               -- verified provider payload
  transaction_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (provider, provider_transaction_reference)
);

-- ----------------------------------------------------------------------------
-- VENDOR SALES  (offline/direct sales tied to a vendor collection transaction)
-- ----------------------------------------------------------------------------
create table vendor_sales (
  id uuid primary key default gen_random_uuid(),
  sale_number text not null unique,      -- e.g. SL-1024
  vendor_id uuid not null references vendors (user_id),
  transaction_id uuid references payment_transactions (id),
  customer_name text,
  customer_phone text,
  notes text,
  sale_status sale_status not null default 'requires_review',
  fulfillment_status fulfillment_status not null default 'pending_handover',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table vendor_sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references vendor_sales (id) on delete cascade,
  product_id uuid not null references products (id),
  variant_id uuid references product_variants (id),
  quantity int not null check (quantity > 0),
  recorded_price numeric(12,2) not null
);

-- ----------------------------------------------------------------------------
-- VENDOR INVENTORY + MOVEMENTS
-- ----------------------------------------------------------------------------
create table vendor_inventory (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors (user_id) on delete cascade,
  product_id uuid not null references products (id),
  variant_id uuid references product_variants (id),
  available_quantity int not null default 0 check (available_quantity >= 0),
  updated_at timestamptz not null default now(),
  unique (vendor_id, product_id, variant_id)
);

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors (user_id),
  product_id uuid not null references products (id),
  variant_id uuid references product_variants (id),
  movement_type movement_type not null,
  quantity int not null,
  previous_quantity int,
  new_quantity int,
  performed_by uuid references users (id),
  notes text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- PRODUCT HANDOVERS
-- ----------------------------------------------------------------------------
create table product_handovers (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references vendor_sales (id) on delete cascade,
  vendor_id uuid not null references vendors (user_id),
  recipient_name text,
  recipient_phone text,
  method handover_method not null,
  handover_date timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- CONTENT: TESTIMONIALS + NEWSLETTER
-- ----------------------------------------------------------------------------
create table testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  quote text not null,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  subscribed_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- AUDIT LOG
-- ----------------------------------------------------------------------------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references users (id),
  action text not null,               -- e.g. 'vendor.suspend', 'sale.record'
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------------------
create index idx_products_category on products (category_id);
create index idx_orders_customer on orders (customer_id);
create index idx_orders_status on orders (order_status, payment_status);
create index idx_payment_tx_vendor on payment_transactions (vendor_id);
create index idx_payment_tx_order on payment_transactions (order_id);
create index idx_vendor_sales_vendor on vendor_sales (vendor_id);
create index idx_vendor_inventory_vendor on vendor_inventory (vendor_id);
create index idx_inventory_movements_vendor on inventory_movements (vendor_id);
create index idx_handovers_vendor on product_handovers (vendor_id);
create index idx_audit_logs_entity on audit_logs (entity_type, entity_id);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (sketch — review and harden before production)
-- ----------------------------------------------------------------------------
alter table users enable row level security;
alter table vendors enable row level security;
alter table vendor_collection_accounts enable row level security;
alter table payment_transactions enable row level security;
alter table vendor_sales enable row level security;
alter table vendor_sale_items enable row level security;
alter table vendor_inventory enable row level security;
alter table inventory_movements enable row level security;
alter table product_handovers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table audit_logs enable row level security;

-- Checks admin status without re-triggering RLS on `users` itself — a
-- policy that queries the same table it protects via a plain subquery
-- causes "infinite recursion detected in policy" on every request.
-- SECURITY DEFINER runs this with the function owner's privileges, which
-- bypasses RLS for this internal lookup only.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  );
$$;

-- Admins: full access
create policy "Admins full access users" on users
  for all using (public.is_admin());

-- Vendors: can only see their own records
create policy "Vendors see own vendor row" on vendors
  for select using (user_id = auth.uid());

create policy "Vendors see own collection account" on vendor_collection_accounts
  for select using (vendor_id = auth.uid());

create policy "Vendors see own transactions" on payment_transactions
  for select using (vendor_id = auth.uid());

create policy "Vendors see own sales" on vendor_sales
  for select using (vendor_id = auth.uid());

create policy "Vendors see own inventory" on vendor_inventory
  for select using (vendor_id = auth.uid());

create policy "Vendors see own movements" on inventory_movements
  for select using (vendor_id = auth.uid());

create policy "Vendors see own handovers" on product_handovers
  for select using (vendor_id = auth.uid());

-- Customers: can only see their own orders
create policy "Customers see own orders" on orders
  for select using (customer_id = auth.uid());

-- Customers must be able to read and update their own profile row —
-- without this, every logged-in customer's account page renders blank.
create policy "Users can view own profile" on users
  for select using (id = auth.uid());

create policy "Users can update own profile" on users
  for update using (id = auth.uid());

-- Storefront catalog & content tables: public can browse, only admins can
-- write. Previously these had RLS disabled entirely, which meant any
-- authenticated client could insert/update/delete them directly via the
-- Supabase API — this closes that gap.
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_variants enable row level security;
alter table delivery_zones enable row level security;
alter table testimonials enable row level security;
alter table newsletter_subscribers enable row level security;

create policy "Anyone can view categories" on categories
  for select using (true);
create policy "Admins manage categories" on categories
  for all using (public.is_admin());

create policy "Anyone can view products" on products
  for select using (true);
create policy "Admins manage products" on products
  for all using (public.is_admin());

create policy "Anyone can view product images" on product_images
  for select using (true);
create policy "Admins manage product images" on product_images
  for all using (public.is_admin());

create policy "Anyone can view product variants" on product_variants
  for select using (true);
create policy "Admins manage product variants" on product_variants
  for all using (public.is_admin());

create policy "Anyone can view delivery zones" on delivery_zones
  for select using (true);
create policy "Admins manage delivery zones" on delivery_zones
  for all using (public.is_admin());

create policy "Anyone can view published testimonials" on testimonials
  for select using (published = true or public.is_admin());
create policy "Admins manage testimonials" on testimonials
  for all using (public.is_admin());

-- No public policies on newsletter_subscribers — only the server-side
-- /api/newsletter route (service-role client) writes to it, and only
-- admins should ever read the list.
create policy "Admins view newsletter subscribers" on newsletter_subscribers
  for select using (public.is_admin());

-- NOTE: The policies above are a starting sketch, not a complete security
-- model. Before production: add matching INSERT/UPDATE policies scoped to
-- role, add admin-full-access policies to every table, and verify webhook /
-- server-side writes use the service-role key (which bypasses RLS by design).

-- ----------------------------------------------------------------------------
-- AUTO-PROVISION PROFILE ROW ON SIGNUP
-- Registration collects name/phone via Supabase Auth's raw_user_meta_data;
-- this trigger mirrors that into `public.users` (and `public.customers` for
-- the default role) as soon as the auth.users row is created, so the app
-- never has to insert into `users` directly from the client.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    new.email,
    new.raw_user_meta_data ->> 'phone',
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'customer')
  );

  if coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'customer') = 'customer' then
    insert into public.customers (user_id) values (new.id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- CUSTOMER DASHBOARD — "My Royal Experience"
-- Wishlist, saved addresses, scent profile, and in-app notifications that
-- power the personalized customer dashboard (see /account/*).
-- ----------------------------------------------------------------------------

create table wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  label text not null,             -- "Home", "Office", etc.
  state text not null,
  city text not null,
  address text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- Simple rule-based scent profile — no ML needed. preferred_families holds
-- free-text tags (e.g. "Woody", "Oud", "Floral") matched against each
-- product's fragrance_notes to drive "Recommended For You".
create table scent_profiles (
  user_id uuid primary key references users (id) on delete cascade,
  preferred_families text[] not null default '{}',
  occasions text[] not null default '{}',
  intensity text,
  updated_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  message text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_wishlist_user on wishlist_items (user_id);
create index idx_addresses_user on customer_addresses (user_id);
create index idx_notifications_user on notifications (user_id, read);

alter table wishlist_items enable row level security;
alter table customer_addresses enable row level security;
alter table scent_profiles enable row level security;
alter table notifications enable row level security;

create policy "Users manage own wishlist" on wishlist_items
  for all using (user_id = auth.uid());

create policy "Users manage own addresses" on customer_addresses
  for all using (user_id = auth.uid());

create policy "Users manage own scent profile" on scent_profiles
  for all using (user_id = auth.uid());

create policy "Users see own notifications" on notifications
  for select using (user_id = auth.uid());

create policy "Users update own notifications" on notifications
  for update using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- PRODUCT IMAGE STORAGE
-- Public bucket for product photography uploaded via the admin dashboard.
-- Uploads happen server-side through a service-role client, which bypasses
-- these policies — they exist as defense-in-depth for any direct access.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Public read product images" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "Admins upload product images" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

create policy "Admins update product images" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());

create policy "Admins delete product images" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());
