-- Ev arkadaşı arayan ilan filtresi (Cerca Coinquilini) kaldırıldı: radarlardaki roommates_only sütunu ve
-- notify_listing_radars içindeki ilgili koşul silinir. Trigger tanımı değişmez, yalnızca fonksiyon yenilenir.
alter table public.listing_radars drop column if exists roommates_only;

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
