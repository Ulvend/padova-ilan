-- 0016'da eklenen fonksiyonlar için güvenlik danışmanı uyarılarını giderir.

-- Tetikleyici fonksiyonu RPC ile çağrılabilir olmamalı (tetikleyicinin çalışması için EXECUTE gerekmez).
revoke execute on function public.sync_poster_profile() from public, anon, authenticated;

-- Sabit değer döndüren fonksiyon için de arama yolu sabitlenir.
alter function public.listing_confirmation_days() set search_path = public;
