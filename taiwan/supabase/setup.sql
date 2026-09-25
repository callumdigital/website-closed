-- Trip Tracker photo uploads: run in Supabase → SQL Editor → New query → Run.
-- Safe to run again, and safe on a project set up with the earlier (single-trip) version:
-- it upgrades it so several trackers (e.g. 'europe' and 'taiwan') can share one project.
-- Each photo is tagged with its trip, and each uploader is allowed to post to specific trips.

-- 1. Who can post to which trip. EDIT THE EMAILS, and add a line per person per trip.
--    The trip names must match `photos.trip` in each site's src/data/trip.js ('europe' if not set).
create table if not exists public.uploaders (email text not null);
alter table public.uploaders add column if not exists trip text not null default 'europe';
alter table public.uploaders drop constraint if exists uploaders_pkey;
alter table public.uploaders add primary key (email, trip);
insert into public.uploaders (email, trip) values
  ('annalisa@example.com', 'europe'),
  ('mitchell@example.com', 'europe'),
  ('you@example.com',      'taiwan')
on conflict do nothing;
-- (Not readable from the website: row level security is on and there are no policies.)
alter table public.uploaders enable row level security;

-- True when the signed-in user may post to trip p_trip.
create or replace function public.can_upload(p_trip text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.uploaders
                 where lower(email) = lower(auth.jwt() ->> 'email') and trip = lower(p_trip));
$$;
-- Older upload pages call this: "on the list for any trip".
create or replace function public.is_uploader() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.uploaders where lower(email) = lower(auth.jwt() ->> 'email'));
$$;

-- 2. One row per photo, tagged with its trip. Everyone can see them; only that trip's uploaders can add or delete.
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  path text not null,
  caption text check (char_length(caption) <= 280),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid()
);
-- Photos from before trips existed belong to the Europe tracker.
alter table public.photos add column if not exists trip text not null default 'europe';
create index if not exists photos_trip_created on public.photos (trip, created_at);
alter table public.photos enable row level security;
grant select on public.photos to anon, authenticated;  -- Supabase normally grants these already;
grant insert, delete on public.photos to authenticated; -- the policies below decide who actually can.
drop policy if exists "Anyone can see photos" on public.photos;
create policy "Anyone can see photos" on public.photos for select using (true);
drop policy if exists "Uploaders can add photos" on public.photos;
create policy "Uploaders can add photos" on public.photos for insert to authenticated with check (public.can_upload(trip));
drop policy if exists "Uploaders can delete photos" on public.photos;
create policy "Uploaders can delete photos" on public.photos for delete to authenticated using (public.can_upload(trip));

-- 3. The image files: a public bucket (anyone with the link can view), max 5 MB each.
--    Files are stored as <trip>/<day>/<id>.jpg; older ones as <day>/<id>.jpg, which count as 'europe'.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
create or replace function public.photo_trip(p_name text) returns text
language sql immutable as $$
  select case when split_part(p_name, '/', 1) ~ '^\d{4}-\d{2}-\d{2}$' then 'europe' else split_part(p_name, '/', 1) end;
$$;
drop policy if exists "Uploaders can upload trip photos" on storage.objects;
create policy "Uploaders can upload trip photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.can_upload(public.photo_trip(name)));
drop policy if exists "Uploaders can delete trip photos" on storage.objects;
create policy "Uploaders can delete trip photos" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and public.can_upload(public.photo_trip(name)));
