-- İlan teyit süresi: sahibi 5 günde bir "Süreyi Yenile" ile teyit etmezse ilan otomatik arşivlenir.
-- Süre src/config.ts LISTING_CONFIRMATION_DAYS ile uyumlu tutulmalıdır.

alter table public.listings
  add column confirmed_at timestamptz not null default now();

-- confirmed_at istemciden gelse de sunucu saatini aşamaz; yeni ilan şimdiden başlar;
-- arşivden çıkarılan (yeniden yayınlanan) ilanın süresi sıfırlanır.
create or replace function public.listings_confirmed_at_guard()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.confirmed_at := now();
  else
    new.confirmed_at := least(new.confirmed_at, now());
    if old.is_archived and not new.is_archived then
      new.confirmed_at := now();
    end if;
  end if;
  return new;
end;
$$;

create trigger listings_confirmed_at_guard
  before insert or update on public.listings
  for each row execute function public.listings_confirmed_at_guard();

-- Süresi dolan ilanları arşivler ('expired' nedeniyle). Yalnızca zamanlayıcı/postgres çağırır.
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
      and confirmed_at < now() - interval '5 days';
  get diagnostics archived_count = row_count;
  return archived_count;
end;
$$;

revoke all on function public.archive_expired_listings() from public, anon, authenticated;

-- Saatlik zamanlama (pg_cron). Uzantı kullanılamıyorsa migration yine de başarılı olur;
-- o durumda arayüz süresi dolan ilanları zaten gizler, arşiv işaretlemesi için fonksiyon elle/başka bir zamanlayıcıyla çağrılabilir.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('archive-expired-listings', '0 * * * *', 'select public.archive_expired_listings()');
exception when others then
  raise notice 'pg_cron zamanlaması kurulamadı (%). public.archive_expired_listings() elle zamanlanmalı.', sqlerrm;
end;
$$;
