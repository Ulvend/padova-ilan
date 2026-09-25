-- Enerji bilgileri: sertifika durumu seçenekleri ve enerji performans endeksi (EPgl / IPE).
-- energy_class: 'exempt' (proprietà esente) ve 'unclassifiable' (non classificabile) eklendi.
-- energy_performance: kWh/m² yıl, ondalıksız; yalnızca A4–G sınıflı konutlarda anlamlıdır. null = belirtilmedi.
alter table public.listings drop constraint if exists listings_energy_class_check;
alter table public.listings
  add constraint listings_energy_class_check
    check (energy_class in ('A4', 'A3', 'A2', 'A1', 'B', 'C', 'D', 'E', 'F', 'G', 'pending', 'exempt', 'unclassifiable'));

alter table public.listings
  add column energy_performance integer
    check (energy_performance is null or (energy_performance > 0 and energy_performance <= 2000));
