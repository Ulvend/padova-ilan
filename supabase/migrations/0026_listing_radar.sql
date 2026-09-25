-- İlan Radarı: kullanıcı kriterlerini bir kez kaydeder; kriterlere uyan yeni ilan yayınlandığında sunucu,
-- kullanıcıya uygulama içi bildirim (notifications) yazar. Eşleştirme istemcideki ana sayfa filtreleriyle aynı
-- kuralları izler (src/utils/listingFilters.ts): bir değişiklik yapılırsa ikisi birlikte güncellenmelidir.

-- ============================================================
-- 1) Tablo
-- ============================================================
-- Boş (null) alan "farketmez" demektir. lang, bildirimin hangi dilde yazılacağını belirler (kaydedildiği andaki arayüz dili).
create table public.listing_radars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  lang text not null default 'it' check (lang in ('tr', 'en', 'it', 'de', 'ru', 'hi')),
  district text check (district is null or char_length(district) <= 100),
  room_type text check (room_type is null or room_type in ('Singola', 'Doppia', 'Monolocale', 'Bilocale')),
  contract_type text check (contract_type is null or char_length(contract_type) <= 100),
  min_price integer check (min_price is null or min_price between 1 and 9999),
  max_price integer check (max_price is null or max_price between 1 and 9999),
  start_from date,
  start_to date,
  max_stay_months smallint check (max_stay_months is null or max_stay_months between 1 and 36),
  gender text check (gender is null or gender in ('female', 'male')),
  only_video_tour boolean not null default false,
  only_student_verified boolean not null default false,
  roommates_only boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  last_notified_at timestamptz,
  check (start_to is null or (start_from is not null and start_to >= start_from)),
  check (min_price is null or max_price is null or min_price <= max_price)
);

create index listing_radars_user_idx on public.listing_radars (user_id);
create index listing_radars_active_idx on public.listing_radars (active) where active;

-- ============================================================
-- 2) RLS: herkes yalnızca kendi radarlarını görür ve yönetir
-- ============================================================
alter table public.listing_radars enable row level security;

create policy "listing_radars_select_owner" on public.listing_radars
  for select using (auth.uid() = user_id);

create policy "listing_radars_insert_owner" on public.listing_radars
  for insert with check (public.email_verified() and auth.uid() = user_id);

create policy "listing_radars_update_owner" on public.listing_radars
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "listing_radars_delete_owner" on public.listing_radars
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 3) Kötüye kullanım sınırı: kullanıcı başına en fazla 5 radar
-- ============================================================
create or replace function public.check_listing_radar_limit()
returns trigger language plpgsql set search_path = public as $$
declare
  existing int;
begin
  perform pg_advisory_xact_lock(hashtext('radar_limit:' || new.user_id::text));
  select count(*) into existing from public.listing_radars where user_id = new.user_id;
  if existing >= 5 then
    raise exception 'radar_limit_reached: at most 5 radars per user' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger trg_listing_radar_limit
  before insert on public.listing_radars
  for each row execute function public.check_listing_radar_limit();

revoke execute on function public.check_listing_radar_limit() from public, anon, authenticated;

-- ============================================================
-- 4) Yeni ilan → eşleşen radar sahiplerine bildirim
-- ============================================================
-- Geçersiz biçimli tarih, ilan eklemeyi asla bozmasın diye güvenli dönüştürme.
create or replace function public.safe_iso_date(p text)
returns date language plpgsql immutable set search_path = public as $$
begin
  if p is null or p !~ '^\d{4}-\d{2}-\d{2}$' then
    return null;
  end if;
  return p::date;
exception when others then
  return null;
end;
$$;

create or replace function public.notify_listing_radars()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_start date := public.safe_iso_date(new.contract_start_iso);
  v_end date := public.safe_iso_date(new.contract_end_iso);
  v_avail date;
  v_months int;
begin
  if new.is_archived then
    return new;
  end if;

  -- Taşınılabilir ilk gün: başlangıç yoksa ya da geçmişteyse bugün (availableFromISO ile aynı).
  v_avail := greatest(coalesce(v_start, current_date), current_date);

  if v_end is not null and v_end < current_date then
    return new;
  end if;

  -- Taşınılabilir günden bitişe kalan ay, en yakın aya yuvarlı ve en az 1 (monthsBetween ile aynı).
  if v_end is not null and v_end > v_avail then
    v_months := greatest(1, round((v_end - v_avail)::numeric / 30.4375))::int;
  end if;

  begin
    with matched as (
      -- Aynı kullanıcının birden çok radarı eşleşirse tek bildirim gider.
      select distinct on (r.user_id) r.id, r.user_id, r.lang, r.name
      from public.listing_radars r
      where r.active
        and r.user_id is distinct from new.user_id
        and (r.district is null or r.district = new.district)
        and (r.room_type is null or r.room_type = new.room_type)
        and (r.contract_type is null or r.contract_type = new.contract_type)
        and (r.min_price is null or new.price >= r.min_price)
        and (r.max_price is null or new.price <= r.max_price)
        and (not r.only_video_tour or new.has_video_tour)
        and (not r.only_student_verified or new.is_student_card_verified)
        and (
          not r.roommates_only
          or jsonb_array_length(coalesce(new.current_flatmates, '[]'::jsonb)) > 0
          or coalesce(new.total_housemates, 0) > 1
        )
        and (r.gender is null
          or (r.gender = 'female' and new.gender_preference is distinct from 'male_only')
          or (r.gender = 'male' and new.gender_preference is distinct from 'female_only'))
        and (r.start_from is null or v_avail >= r.start_from)
        and (r.start_to is null or v_avail <= r.start_to)
        and (r.max_stay_months is null or (v_months is not null and v_months <= r.max_stay_months))
      order by r.user_id, r.created_at
    ),
    inserted as (
      insert into public.notifications (user_id, title, message, type, created_at, "timestamp", link_view, link_id)
      select
        m.user_id,
        case m.lang
          when 'tr' then 'Radarında yeni ilan'
          when 'en' then 'New listing on your radar'
          when 'de' then 'Neue Anzeige auf deinem Radar'
          when 'ru' then 'Новое объявление на вашем радаре'
          when 'hi' then 'आपके रडार पर नया विज्ञापन'
          else 'Nuovo annuncio nel tuo radar'
        end,
        left(new.title || ' · €' || new.price::int::text || ' · Radar: ' || m.name, 500),
        'listing',
        now(),
        (extract(epoch from now()) * 1000)::bigint,
        'listingDetail',
        new.id
      from matched m
      returning 1
    )
    update public.listing_radars set last_notified_at = now()
      where id in (select id from matched);
  exception when others then
    -- Bildirim üretimi hiçbir koşulda ilan yayınlamayı engellememeli.
    raise warning 'notify_listing_radars failed: %', sqlerrm;
  end;

  return new;
end;
$$;

create trigger trg_notify_listing_radars
  after insert on public.listings
  for each row execute function public.notify_listing_radars();

revoke execute on function public.notify_listing_radars() from public, anon, authenticated;
