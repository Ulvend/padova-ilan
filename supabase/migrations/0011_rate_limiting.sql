-- Spam önleme: doğrulanmış bir hesabı ele geçiren bir bot saniyede yüzlerce mesaj/ilan ekleyemesin.
--
-- Sayım, istemcinin gönderdiği zamana (messages.created_at ms / listings.created_at) DEĞİL, sunucu saatine
-- bakar; çünkü o alanları istemci istediği değere ayarlayabilir. Bu yüzden mesajlara sunucu zaman damgası
-- (sent_at) eklenir, ilanlarda created_at insert sırasında sunucu saatiyle ezilir.
--
-- İstemci, hata iletisindeki 'rate_limit_exceeded' ifadesini yakalayıp kullanıcıya anlaşılır bir mesaj gösterir.
-- Adminler sınırdan muaftır.

-- ============================================================
-- Mesajlar: kullanıcı başına dakikada en fazla 10
-- ============================================================

alter table public.messages
  add column sent_at timestamptz not null default now();

create index messages_sender_sent_idx on public.messages (sender_id, sent_at desc);

create or replace function public.check_message_rate_limit()
returns trigger language plpgsql set search_path = public as $$
declare
  recent_count int;
begin
  new.sent_at := now();

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

create trigger trg_message_rate_limit
  before insert on public.messages
  for each row execute function public.check_message_rate_limit();

-- ============================================================
-- İlanlar: kullanıcı başına saatte en fazla 5 yeni ilan
-- ============================================================

create index listings_user_created_idx on public.listings (user_id, created_at desc);

create or replace function public.check_listing_rate_limit()
returns trigger language plpgsql set search_path = public as $$
declare
  recent_count int;
begin
  -- created_at istemciden geldiği için sunucu saatiyle ezilir; sayım buna dayanır.
  new.created_at := now();

  if public.is_admin() or new.user_id is null then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('listing_rate:' || new.user_id::text));

  select count(*) into recent_count
  from public.listings
  where user_id = new.user_id
    and created_at > now() - interval '1 hour';

  if recent_count >= 5 then
    raise exception 'rate_limit_exceeded: too many new listings, please try again later' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger trg_listing_rate_limit
  before insert on public.listings
  for each row execute function public.check_listing_rate_limit();
