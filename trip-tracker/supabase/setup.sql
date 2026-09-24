-- Trip Tracker photo uploads: run this once in Supabase → SQL Editor → New query → Run.
-- It's safe to run again (e.g. after changing the emails below).
--
-- 1. EDIT THESE: the email addresses allowed to upload and delete photos.
create table if not exists public.uploaders (email text primary key);
insert into public.uploaders (email) values
  ('annalisa@example.com'),
  ('mitchell@example.com')
on conflict do nothing;
-- (Not readable from the website: row level security is on and there are no policies.)
alter table public.uploaders enable row level security;

-- True when the signed-in user's email is on the uploaders list.
create or replace function public.is_uploader() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.uploaders where lower(email) = lower(auth.jwt() ->> 'email'));
$$;

-- 2. One row per photo. Everyone can see them; only uploaders can add or delete.
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  path text not null,
  caption text check (char_length(caption) <= 280),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid()
);
alter table public.photos enable row level security;
drop policy if exists "Anyone can see photos" on public.photos;
create policy "Anyone can see photos" on public.photos for select using (true);
drop policy if exists "Uploaders can add photos" on public.photos;
create policy "Uploaders can add photos" on public.photos for insert to authenticated with check (public.is_uploader());
drop policy if exists "Uploaders can delete photos" on public.photos;
create policy "Uploaders can delete photos" on public.photos for delete to authenticated using (public.is_uploader());

-- 3. Where the image files live: a public bucket (anyone with the link can view), max 5 MB each.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
drop policy if exists "Uploaders can upload trip photos" on storage.objects;
create policy "Uploaders can upload trip photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.is_uploader());
drop policy if exists "Uploaders can delete trip photos" on storage.objects;
create policy "Uploaders can delete trip photos" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and public.is_uploader());
