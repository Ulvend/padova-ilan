-- İlanlara depozito (deposito cauzionale) ve aylık kondominyum gideri (spese condominiali): isteğe bağlı, euro cinsinden tutarlar.
-- null = belirtilmedi. Üst sınır makul bir güvenlik payıdır; asıl yasal sınır (Legge 392/1978, art. 11: en fazla
-- 3 aylık kira) arayüzde kira ile birlikte denetlenir. Kira sütunu (price) < 10000 olduğundan 3 katı 30000'i aşmaz.
alter table public.listings
  add column deposit numeric
    check (deposit is null or (deposit > 0 and deposit <= 30000)),
  add column condo_fees numeric
    check (condo_fees is null or (condo_fees > 0 and condo_fees <= 2000));
