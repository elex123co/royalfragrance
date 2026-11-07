-- Editable website wording (admin dashboard -> Site Text). Safe to re-run.
create table if not exists site_content (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table site_content enable row level security;

drop policy if exists "Anyone can read site content" on site_content;
create policy "Anyone can read site content" on site_content for select using (true);

drop policy if exists "Admins manage site content" on site_content;
create policy "Admins manage site content" on site_content
  for all using (public.is_admin()) with check (public.is_admin());
