-- Güvenlik sertleştirmesi:
--   Y1) İlandaki poster (ad, kullanıcı adı, avatar, rozet) istemciden alınmaz; sunucu profilden doldurur.
--   Y2) Doğrulama rozetleri (video, adil fiyat) ilan sahibi tarafından yazılamaz.
--   Y3) Storage kovalarının içeriği listelenemez (dosya URL'leri çalışmaya devam eder).
--   Y4) Kullanıcı başına depolama kotası.
--   Y5) Mesajlar silinemez; hesap silinince karşı tarafın mesajları ve kullanıcıya dair şikayetler korunur.

-- ============================================================
-- Y1) poster'ı sunucu doldurur
-- ============================================================
-- BEFORE INSERT tetikleyicisi RLS'in WITH CHECK denetiminden önce çalışır; bu yüzden ilan ekleme politikasındaki
-- (poster->>'id') ve verifiedUniPD denetimi artık sunucunun ürettiği değere bakar.
-- Güncellemelerde poster zaten korumalıdır (enforce_listing_owner_protected_keys); profil değişimi
-- sync_poster_profile ile yansır.

create or replace function public.fill_listing_poster()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  prof public.profiles%rowtype;
begin
  select * into prof from public.profiles where id = new.user_id;
  if not found then
    raise exception 'profile_required: complete your profile before posting a listing' using errcode = 'P0001';
  end if;
  new.poster := jsonb_build_object(
    'id', new.user_id::text,
    'username', prof.username,
    'name', prof.name,
    'avatar', coalesce(
      nullif(prof.photo_url, ''),
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80'
    ),
    'verifiedUniPD', public.is_unipd_verified(),
    'department', coalesce(nullif(prof.faculty, ''), 'UniPD')
  );
  return new;
end;
$$;

revoke execute on function public.fill_listing_poster() from public, anon, authenticated;

create trigger listings_fill_poster
  before insert on public.listings
  for each row execute function public.fill_listing_poster();

-- ============================================================
-- Y2) Rozetleri yalnızca admin yazar
-- ============================================================
-- Sahip için: yeni ilan rozetsiz başlar; güncellemede adil fiyat alanları değişmez; video rozeti
-- yalnızca admin verir ve video adresi/açıları değişirse (doğrulanan içerik değiştiği için) düşer.
-- auth.uid() boşsa (SQL editörü, service role, migration) müdahale edilmez.

create or replace function public.enforce_listing_badges()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.has_video_tour := false;
    new.fair_price_status := 'average';
    new.fair_price_text := '';
  else
    new.fair_price_status := old.fair_price_status;
    new.fair_price_text := old.fair_price_text;
    if new.video_url is distinct from old.video_url
      or new.video_angles is distinct from old.video_angles then
      new.has_video_tour := false;
    else
      new.has_video_tour := old.has_video_tour;
    end if;
  end if;
  return new;
end;
$$;

create trigger listings_badge_guard
  before insert or update on public.listings
  for each row execute function public.enforce_listing_badges();

-- ============================================================
-- Y3) Storage: içerik listelenemez, yalnızca sahibi kendi klasörünü görür
-- ============================================================
-- Public kovalarda /object/public/... adresi RLS'e bağlı değildir; SELECT politikası yalnızca listelemeye
-- (ve silme/upsert gibi işlemlerin dosyayı bulmasına) yarar. Herkese açık okuma yerine sahip-only okuma kalır.

drop policy if exists "profile_photos_public_read" on storage.objects;
drop policy if exists "listing_photos_public_read" on storage.objects;

create policy "profile_photos_owner_read" on storage.objects
  for select using (
    bucket_id = 'profile_photos'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "listing_photos_owner_read" on storage.objects
  for select using (
    bucket_id = 'listing_photos'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- Y4) Depolama kotası
-- ============================================================
-- İstemci fotoğrafları ~100–200 KB'a sıkıştırır; tek dosya sınırı 2 MB'a çekilir ve kullanıcı başına dosya sayısı
-- sınırlanır (en kötü durum: sayı x 2 MB). Sayım insert politikasında yapılır.

update storage.buckets
  set file_size_limit = 2097152
  where id in ('profile_photos', 'listing_photos');

create or replace function public.storage_quota_available(p_bucket text, p_max int)
returns boolean language sql stable security definer set search_path = public, storage as $$
  select count(*) < p_max
  from storage.objects
  where bucket_id = p_bucket
    and (storage.foldername(name))[1] = auth.uid()::text;
$$;

revoke execute on function public.storage_quota_available(text, int) from public, anon;
grant execute on function public.storage_quota_available(text, int) to authenticated;

drop policy if exists "profile_photos_owner_write" on storage.objects;
create policy "profile_photos_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'profile_photos'
    and (select auth.uid())::text = (storage.foldername(name))[1]
    and public.storage_quota_available('profile_photos', 50)
  );

drop policy if exists "listing_photos_owner_write" on storage.objects;
create policy "listing_photos_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'listing_photos'
    and (select auth.uid())::text = (storage.foldername(name))[1]
    and public.email_verified()
    and public.storage_quota_available('listing_photos', 300)
  );

-- ============================================================
-- Y5) Kanıtların korunması
-- ============================================================
-- Gönderici mesajını silemez (istemci mesaj silmiyor; silme yalnızca hesap silinince olur).
drop policy if exists "messages_delete_sender" on public.messages;

-- Hesap silinince karşı tarafın gelen kutusu kaybolmasın: taraf boşaltılır (istemcide "silinmiş hesap").
alter table public.messages
  alter column sender_id drop not null,
  alter column recipient_id drop not null;

alter table public.messages
  drop constraint messages_sender_id_fkey,
  drop constraint messages_recipient_id_fkey,
  add constraint messages_sender_id_fkey foreign key (sender_id) references auth.users(id) on delete set null,
  add constraint messages_recipient_id_fkey foreign key (recipient_id) references auth.users(id) on delete set null;

-- Kullanıcıya yönelik şikayet, kullanıcı hesabını silse de saklanır (uuid düz sütun olarak kalır).
alter table public.reports drop constraint reports_target_user_id_fkey;

-- Saklama süresi: iki tarafı da silinmiş (kimse okuyamayan) mesajlar 90 gün sonra temizlenir.
create or replace function public.purge_orphaned_messages()
returns integer language plpgsql security definer set search_path = public as $$
declare
  purged integer;
begin
  delete from public.messages
    where sender_id is null
      and recipient_id is null
      and sent_at < now() - interval '90 days';
  get diagnostics purged = row_count;
  return purged;
end;
$$;

revoke all on function public.purge_orphaned_messages() from public, anon, authenticated;

do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('purge-orphaned-messages', '30 3 * * *', 'select public.purge_orphaned_messages()');
exception when others then
  raise notice 'pg_cron zamanlaması kurulamadı (%). public.purge_orphaned_messages() elle zamanlanmalı.', sqlerrm;
end;
$$;
