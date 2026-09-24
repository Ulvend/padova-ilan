-- İlan ve kullanıcı şikayet (report) altyapısı: topluluk sahte/şüpheli ilanları yöneticilere bildirebilir.
--
-- Kurallar:
--   * Yalnızca e-postası doğrulanmış kullanıcılar şikayet oluşturabilir; kendi ilanını/kendisini bildiremez.
--   * Bir şikayetin tam olarak bir hedefi vardır (ilan YA DA kullanıcı).
--   * Aynı kullanıcı aynı hedef için birden fazla "bekleyen" şikayet açamaz.
--   * Kullanıcı başına saatte en fazla 5 şikayet (sunucu saatine göre; adminler muaf).
--   * Şikayetleri yalnızca yöneticiler okur ve yönetir; şikayet edenin kimliği diğer kullanıcılara görünmez.

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_listing_id text references public.listings(id) on delete cascade,
  target_user_id uuid references auth.users(id) on delete cascade,
  reason text not null default '' check (char_length(reason) <= 500),
  category text not null check (category in ('scam', 'fake_photo', 'inappropriate', 'spam', 'other')),
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  constraint reports_single_target
    check ((target_listing_id is not null)::int + (target_user_id is not null)::int = 1),
  constraint reports_not_self
    check (target_user_id is null or target_user_id <> reporter_id),
  -- "Diğer" kategorisinde açıklama zorunlu.
  constraint reports_other_needs_reason
    check (category <> 'other' or char_length(btrim(reason)) > 0)
);

create unique index reports_unique_pending_listing
  on public.reports (reporter_id, target_listing_id)
  where status = 'pending' and target_listing_id is not null;

create unique index reports_unique_pending_user
  on public.reports (reporter_id, target_user_id)
  where status = 'pending' and target_user_id is not null;

create index reports_status_created_idx on public.reports (status, created_at desc);
create index reports_reporter_created_idx on public.reports (reporter_id, created_at desc);

alter table public.reports enable row level security;

-- Kullanıcılar şikayet oluşturabilir (doğrulanmış e-posta, kendi adına, bekleyen durumda, kendi ilanı değil).
create policy "reports_insert_verified" on public.reports
  for insert with check (
    auth.uid() = reporter_id
    and public.email_verified()
    and status = 'pending'
    and not exists (
      select 1 from public.listings l
      where l.id = target_listing_id and l.user_id = auth.uid()
    )
  );

-- Yalnızca yöneticiler şikayetleri görebilir ve yönetebilir.
create policy "reports_select_admin" on public.reports
  for select using (public.is_admin());

create policy "reports_update_admin" on public.reports
  for update using (public.is_admin()) with check (public.is_admin());

create policy "reports_delete_admin" on public.reports
  for delete using (public.is_admin());

-- Yeni şikayet: sunucu saati + saatlik sınır.
create or replace function public.check_report_rate_limit()
returns trigger language plpgsql set search_path = public as $$
declare
  recent_count int;
begin
  new.created_at := now();
  new.reviewed_by := null;
  new.reviewed_at := null;

  if public.is_admin() then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('report_rate:' || new.reporter_id::text));

  select count(*) into recent_count
  from public.reports
  where reporter_id = new.reporter_id
    and created_at > now() - interval '1 hour';

  if recent_count >= 5 then
    raise exception 'rate_limit_exceeded: too many reports, please try again later' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger trg_report_rate_limit
  before insert on public.reports
  for each row execute function public.check_report_rate_limit();

-- Güncellemede yalnızca durum değişebilir; inceleyen ve zaman damgası sunucuda doldurulur.
create or replace function public.enforce_report_status_only_update()
returns trigger language plpgsql as $$
begin
  if new.reporter_id is distinct from old.reporter_id
    or new.target_listing_id is distinct from old.target_listing_id
    or new.target_user_id is distinct from old.target_user_id
    or new.reason is distinct from old.reason
    or new.category is distinct from old.category
    or new.created_at is distinct from old.created_at then
    raise exception 'Only the status of a report can be changed';
  end if;

  if new.status is distinct from old.status then
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  else
    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
  end if;

  return new;
end;
$$;

create trigger trg_report_status_only_update
  before update on public.reports
  for each row execute function public.enforce_report_status_only_update();
