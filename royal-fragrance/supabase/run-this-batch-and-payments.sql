-- Run once in the Supabase SQL editor. Safe to run more than once.
-- Covers batch delivery (patches 103 to 111) and payment history (108).

create table if not exists batch_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text not null default 'Lagos',
  batch_fee numeric not null default 0 check (batch_fee >= 0),
  individual_fee numeric not null default 0 check (individual_fee >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists delivery_batches (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references batch_locations(id) on delete restrict,
  created_by uuid references auth.users(id) on delete set null,
  created_by_role text not null default 'admin' check (created_by_role in ('admin','vendor')),
  cycle text not null default 'weekly' check (cycle in ('weekly','monthly','custom')),
  closes_at timestamptz not null,
  max_members integer not null check (max_members >= 1),
  status text not null default 'open' check (status in ('open','closed','delivered','cancelled')),
  label text,
  created_at timestamptz not null default now()
);

alter table delivery_batches add column if not exists starts_at timestamptz not null default now();
alter table delivery_batches add column if not exists min_members integer check (min_members >= 1);

alter table orders add column if not exists batch_id uuid references delivery_batches(id) on delete set null;
alter table orders add column if not exists batch_fee_share numeric not null default 0;
alter table orders add column if not exists batch_switched_at timestamptz;
alter table orders add column if not exists balance_due numeric not null default 0;
alter table orders add column if not exists balance_settled boolean not null default false;
alter table orders add column if not exists paid_at timestamptz;
create index if not exists orders_batch_idx on orders(batch_id);

alter table vendors add column if not exists batch_location_id uuid references batch_locations(id) on delete set null;

update orders set paid_at = updated_at where payment_status = 'paid' and paid_at is null;

alter table batch_locations enable row level security;
alter table delivery_batches enable row level security;
drop policy if exists "Admins manage batch locations" on batch_locations;
drop policy if exists "Admins manage delivery batches" on delivery_batches;
create policy "Admins manage batch locations" on batch_locations for all using (public.is_admin());
create policy "Admins manage delivery batches" on delivery_batches for all using (public.is_admin());
