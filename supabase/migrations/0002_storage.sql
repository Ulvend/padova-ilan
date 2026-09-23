-- Storage buckets replacing Firebase Storage, same path scheme:
-- profile_photos/{userId}/{fileName}, listing_photos/{userId}/{fileName}

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('profile_photos', 'profile_photos', true, 5242880, array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml']),
  ('listing_photos', 'listing_photos', true, 5242880, array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml'])
on conflict (id) do nothing;

-- Public read for both buckets.
create policy "profile_photos_public_read" on storage.objects
  for select using (bucket_id = 'profile_photos');

create policy "listing_photos_public_read" on storage.objects
  for select using (bucket_id = 'listing_photos');

-- Owner-only write, matching storage.rules' {userId}/{fileName} folder convention:
-- storage.foldername(name) splits the object path into its folder segments.
create policy "profile_photos_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'profile_photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "profile_photos_owner_update" on storage.objects
  for update using (
    bucket_id = 'profile_photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "profile_photos_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'profile_photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Listing photo uploads additionally require a verified email (matches storage.rules).
create policy "listing_photos_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'listing_photos'
    and auth.uid()::text = (storage.foldername(name))[1]
    and public.email_verified()
  );

create policy "listing_photos_owner_update" on storage.objects
  for update using (
    bucket_id = 'listing_photos'
    and auth.uid()::text = (storage.foldername(name))[1]
    and public.email_verified()
  );

create policy "listing_photos_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'listing_photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
