-- Süresiz ilan verilemez: sözleşme başlangıç ve bitiş tarihi zorunlu, bitiş başlangıçtan sonra olmalı.
-- coalesce gerekli; NULL üzerindeki bir CHECK "bilinmiyor" döner ve kısıtı geçerdi.

alter table public.listings
  add constraint listings_contract_dates_required check (
    coalesce(contract_start_iso, '') ~ '^\d{4}-\d{2}-\d{2}$'
    and coalesce(contract_end_iso, '') ~ '^\d{4}-\d{2}-\d{2}$'
    and contract_end_iso > contract_start_iso
  );
