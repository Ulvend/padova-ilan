-- "Centro Storico / Prato della Valle" iki ayrı semte bölündü: 'Centro Storico' ve 'Prato della Valle'.
-- Semt, istemcide konuma en yakın semt merkezinden türetilir (wizard/formModel.ts, DISTRICT_COORDINATES_MAP);
-- mevcut ilanlar aynı kuralla yeniden atanır: koordinatı olan ilan iki merkezden yakın olana, olmayan Centro Storico'ya gider.
update public.listings
set district = case
  when lat is not null and lng is not null
    and ((lat - 45.3992) ^ 2 + ((lng - 11.8755) * cos(radians(lat))) ^ 2)
      < ((lat - 45.4066) ^ 2 + ((lng - 11.8768) * cos(radians(lat))) ^ 2)
  then 'Prato della Valle'
  else 'Centro Storico'
end
where district = 'Centro Storico / Prato della Valle';

-- Eski birleşik semte kayıtlı radar iki yeni semti de kapsamalı; tek semte daraltmak yerine "farketmez"e çevrilir.
update public.listing_radars
set district = null
where district = 'Centro Storico / Prato della Valle';
