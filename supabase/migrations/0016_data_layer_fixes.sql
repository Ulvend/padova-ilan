-- Veri katmanı düzeltmeleri:
--   1) Mesaj zamanı sunucu saatinden gelir (cihaz saatine bağlı sıralama biter).
--   2) İlandaki poster.name / poster.avatar de poster.username gibi profille senkron tutulur.
--   3) İlan teyit süresi tek yerde (listing_confirmation_days) tanımlanır; süresi dolan ilanlar
--      pg_cron kurulu olmasa bile API üzerinden başkalarına görünmez.

-- ============================================================
-- 1) Mesajlarda sunucu zamanı
-- ============================================================
-- messages.created_at (ms) eskiden istemcinin Date.now() değeriydi. Sıralama bu sütunla yapıldığı için
-- eski kayıtlar korunur; yeni kayıtlarda değer insert sırasında sunucu saatiyle ezilir.

alter table public.messages
  alter column created_at set default floor(extract(epoch from now()) * 1000)::bigint;

create or replace function public.check_message_rate_limit()
returns trigger language plpgsql set search_path = public as $$
declare
  recent_count int;
begin
  new.sent_at := now();
  new.created_at := floor(extract(epoch from now()) * 1000)::bigint;

  if public.is_admin() then
    return new;
  end if;

  -- Aynı göndericiden eşzamanlı insert'ler sırayla sayılsın (paralel istekle sınır aşılamasın).
  perform pg_advisory_xact_lock(hashtext('message_rate:' || new.sender_id::text));

  select count(*) into recent_count
  from public.messages
  where sender_id = new.sender_id
    and sent_at > now() - interval '1 minute';

  if recent_count >= 10 then
    raise exception 'rate_limit_exceeded: too many messages, please wait a minute' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

-- ============================================================
-- 2) İlandaki ad / avatar / kullanıcı adı profille senkron
-- ============================================================

-- Koruma tetikleyicisi sahibin poster alanını değiştirmesini reddeder; yalnızca profil senkronunun
-- (başka bir tetikleyicinin içinden, pg_trigger_depth() > 1) yaptığı değişime izin verilir.
create or replace function public.enforce_listing_owner_protected_keys()
returns trigger language plpgsql as $$
declare
  poster_ok boolean;
begin
  if public.is_admin() then
    return new;
  end if;
  poster_ok := new.poster is not distinct from old.poster
    or pg_trigger_depth() > 1
    or (
      (new.poster - 'username') = (old.poster - 'username')
      and new.poster->>'username' = (select username from public.profiles where id = old.user_id)
    );
  if new.user_id is distinct from old.user_id
    or new.is_student_card_verified is distinct from old.is_student_card_verified
    or not poster_ok
    or new.created_at is distinct from old.created_at then
    raise exception 'Cannot modify protected listing fields as owner';
  end if;
  return new;
end;
$$;

-- Profil boş bir fotoğraf adresi taşıyorsa ilandaki mevcut avatar korunur.
create or replace function public.sync_poster_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.listings
    set poster = poster
      || jsonb_build_object('username', new.username, 'name', new.name)
      || case when new.photo_url <> '' then jsonb_build_object('avatar', new.photo_url) else '{}'::jsonb end
    where user_id = new.id
      and (
        poster->>'username' is distinct from new.username
        or poster->>'name' is distinct from new.name
        or (new.photo_url <> '' and poster->>'avatar' is distinct from new.photo_url)
      );
  return new;
end;
$$;

drop trigger if exists profiles_sync_poster_username on public.profiles;
create trigger profiles_sync_poster_profile
  after insert or update of username, name, photo_url on public.profiles
  for each row execute function public.sync_poster_profile();

drop function if exists public.sync_poster_username();

-- Mevcut sapmaları düzelt (migration, oturumsuz çalıştığı için koruma tetikleyicisi geçici kapatılır).
alter table public.listings disable trigger listings_protect_owner_fields;
update public.listings l
  set poster = l.poster
    || jsonb_build_object('username', p.username, 'name', p.name)
    || case when p.photo_url <> '' then jsonb_build_object('avatar', p.photo_url) else '{}'::jsonb end
  from public.profiles p
  where p.id = l.user_id
    and (
      l.poster->>'username' is distinct from p.username
      or l.poster->>'name' is distinct from p.name
      or (p.photo_url <> '' and l.poster->>'avatar' is distinct from p.photo_url)
    );
alter table public.listings enable trigger listings_protect_owner_fields;

-- ============================================================
-- 3) İlan teyit süresi: tek kaynak + sunucu tarafı gizleme
-- ============================================================

-- Süre yalnızca burada yazılır; istemci değeri bu fonksiyondan okur (src/config.ts varsayılanı yalnızca yedektir).
create or replace function public.listing_confirmation_days()
returns int language sql immutable as $$
  select 5;
$$;

grant execute on function public.listing_confirmation_days() to anon, authenticated;

create or replace function public.archive_expired_listings()
returns integer language plpgsql security definer set search_path = public as $$
declare
  archived_count integer;
begin
  update public.listings
    set is_archived = true,
        archive_reason = 'expired',
        confirmation_time_left = ''
    where not is_archived
      and confirmed_at < now() - make_interval(days => public.listing_confirmation_days());
  get diagnostics archived_count = row_count;
  return archived_count;
end;
$$;

revoke all on function public.archive_expired_listings() from public, anon, authenticated;

-- Süresi dolmuş ilan (henüz arşivlenmemiş olsa bile) yalnızca sahibine ve adminlere görünür;
-- böylece pg_cron çalışmasa da API başkalarına süresi dolmuş ilan döndürmez.
drop policy if exists "listings_select_public" on public.listings;
create policy "listings_select_public" on public.listings
  for select using (
    (select public.is_admin())
    or user_id = (select auth.uid())
    or (
      archive_reason is distinct from 'expired'
      and (is_archived or confirmed_at > now() - make_interval(days => public.listing_confirmation_days()))
    )
  );
