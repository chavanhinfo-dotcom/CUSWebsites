-- Option E's live content: one-time setup, run in Supabase → SQL Editor.
-- Creates the content table (anyone may read it; only listed admins may change it), the admin list, and the
-- public picture store. Put your admin email(s) on the last line before running.

-- the content: one row per section (milestones, dealerships, leadership, faq, figures, company, districts)
create table if not exists public.site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- who may edit it (the emails of their Supabase logins)
create table if not exists public.site_admins (
  email text primary key
);

alter table public.site_content enable row level security;
alter table public.site_admins enable row level security;

create or replace function public.is_site_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.site_admins where lower(email) = lower(auth.jwt() ->> 'email'));
$$;

drop policy if exists "content is public" on public.site_content;
create policy "content is public" on public.site_content for select using (true);
drop policy if exists "admins add content" on public.site_content;
create policy "admins add content" on public.site_content for insert to authenticated with check (public.is_site_admin());
drop policy if exists "admins change content" on public.site_content;
create policy "admins change content" on public.site_content for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
drop policy if exists "admins remove content" on public.site_content;
create policy "admins remove content" on public.site_content for delete to authenticated using (public.is_site_admin());

-- an admin can see only their own entry (the admin page uses this to check access)
drop policy if exists "admins see themselves" on public.site_admins;
create policy "admins see themselves" on public.site_admins for select to authenticated using (lower(email) = lower(auth.jwt() ->> 'email'));

-- pictures (milestone photos, logos, portraits): public to view, uploaded by admins
insert into storage.buckets (id, name, public) values ('site-media', 'site-media', true) on conflict (id) do nothing;
drop policy if exists "media is public" on storage.objects;
create policy "media is public" on storage.objects for select using (bucket_id = 'site-media');
drop policy if exists "admins upload media" on storage.objects;
create policy "admins upload media" on storage.objects for insert to authenticated with check (bucket_id = 'site-media' and public.is_site_admin());
drop policy if exists "admins replace media" on storage.objects;
create policy "admins replace media" on storage.objects for update to authenticated using (bucket_id = 'site-media' and public.is_site_admin());
drop policy if exists "admins remove media" on storage.objects;
create policy "admins remove media" on storage.objects for delete to authenticated using (bucket_id = 'site-media' and public.is_site_admin());

-- your admin email(s): change this, and add a line per admin
insert into public.site_admins (email) values ('admin@example.com') on conflict do nothing;
