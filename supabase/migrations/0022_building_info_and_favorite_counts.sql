-- 1) Ev bilgileri: enerji sınıfı (APE), kat, asansör ve kat planı (planimetria).
-- 2) İlan sahibi için ilan başına favori sayısı (yalnızca sayı; kimin favorilediği gösterilmez).

-- ============================================================
-- 1) Ev bilgileri
-- ============================================================
-- energy_class: İtalya'da kiralık ilanlarda APE enerji sınıfının belirtilmesi yasal zorunluluktur.
-- 'pending': sertifika yok ya da hazırlanıyor (ilanda "APE hazırlanıyor" olarak gösterilir).
-- floor: 0 = zemin kat (piano terra), -1 = bodrum/seminterrato.
-- floor_plan_url: kat planı görseli (listing_photos kovasında, yalnızca https adresi).
alter table public.listings
  add column energy_class text
    check (energy_class in ('A4', 'A3', 'A2', 'A1', 'B', 'C', 'D', 'E', 'F', 'G', 'pending')),
  add column floor smallint
    check (floor between -2 and 60),
  add column has_elevator boolean,
  add column floor_plan_url text
    check (floor_plan_url is null or (char_length(floor_plan_url) <= 2048 and floor_plan_url ~ '^https://'));

-- ============================================================
-- 2) Favori sayıları
-- ============================================================
-- Favoriler profile_private.saved_listing_ids içinde ve yalnızca sahibince okunur. Bu fonksiyon çağıranın kendi
-- ilanları için toplam sayıyı döndürür; kendi ilanını favorileyen sahibin kendisi sayılmaz.
create index if not exists profile_private_saved_listing_ids_idx
  on public.profile_private using gin (saved_listing_ids);

create or replace function public.listing_favorite_counts()
returns table (listing_id text, favorites bigint)
language sql stable security definer set search_path = public as $$
  select l.id, count(*)
  from public.listings l
  join public.profile_private pp on pp.saved_listing_ids @> array[l.id]
  where l.user_id = auth.uid()
    and pp.user_id is distinct from l.user_id
  group by l.id;
$$;

revoke execute on function public.listing_favorite_counts() from public, anon;
grant execute on function public.listing_favorite_counts() to authenticated;
