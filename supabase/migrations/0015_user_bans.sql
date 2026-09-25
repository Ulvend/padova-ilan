-- Kullanıcı banlama: yöneticiler şikayet edilen kullanıcıyı (ya da şikayet edilen ilanın sahibini) banlayabilir.
--
-- Ban üç katmanda işler:
--   1. auth.users.banned_until: Supabase Auth banlı kullanıcının girişini ve oturum yenilemesini reddeder.
--   2. Yazma engeli: elindeki erişim anahtarının süresi dolana kadar (en fazla ~1 saat) bile banlı kullanıcı
--      ilan, mesaj, şikayet ve profil yazamaz.
--   3. Yayındaki ilanları arşivlenir.
-- Yöneticiler banlanamaz; yönetici kendini banlayamaz. Ban/ban kaldırma yalnızca aşağıdaki fonksiyonlarla yapılır.

create table public.banned_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reason text not null default '' check (char_length(reason) <= 500),
  report_id uuid references public.reports(id) on delete set null,
  banned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.banned_users enable row level security;

-- Kullanıcı kendi ban kaydını görebilir (uygulama oturumu kapatıp bilgi verir); yöneticiler hepsini görür.
-- Ekleme/silme politikası yok: yalnızca security definer fonksiyonlar yazar.
create policy "banned_users_select_self_or_admin" on public.banned_users
  for select using (auth.uid() = user_id or public.is_admin());

create or replace function public.is_banned(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select uid is not null and exists(select 1 from public.banned_users where user_id = uid);
$$;

create or replace function public.block_banned_writes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_banned(auth.uid()) and not public.is_admin() then
    raise exception 'account_banned' using errcode = '42501';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger trg_block_banned_listings
  before insert or update on public.listings
  for each row execute function public.block_banned_writes();

create trigger trg_block_banned_messages
  before insert or update on public.messages
  for each row execute function public.block_banned_writes();

create trigger trg_block_banned_reports
  before insert on public.reports
  for each row execute function public.block_banned_writes();

create trigger trg_block_banned_profiles
  before insert or update on public.profiles
  for each row execute function public.block_banned_writes();

create or replace function public.admin_ban_user(p_user_id uuid, p_reason text default '', p_report_id uuid default null)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_user_id is null or p_user_id = auth.uid() then
    raise exception 'cannot_ban_self' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.admins where uid = p_user_id) then
    raise exception 'cannot_ban_admin' using errcode = 'P0001';
  end if;
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'user_not_found' using errcode = 'P0001';
  end if;

  insert into public.banned_users (user_id, reason, report_id, banned_by)
  values (p_user_id, left(btrim(coalesce(p_reason, '')), 500), p_report_id, auth.uid())
  on conflict (user_id) do update
    set reason = excluded.reason, report_id = excluded.report_id,
        banned_by = excluded.banned_by, created_at = now();

  -- Supabase Auth'un kalıcı ban karşılığı (yönetim API'sindeki uzun ban_duration ile aynı etki).
  update auth.users set banned_until = now() + interval '100 years' where id = p_user_id;

  update public.listings
    set is_archived = true, archive_reason = 'Hesap askıya alındı', confirmation_time_left = ''
    where user_id = p_user_id and not is_archived;

  -- Bu kullanıcıyla veya ilanlarıyla ilgili bekleyen şikayetler incelendi sayılır.
  update public.reports
    set status = 'reviewed'
    where status = 'pending'
      and (target_user_id = p_user_id
        or target_listing_id in (select id from public.listings where user_id = p_user_id));
end;
$$;

create or replace function public.admin_unban_user(p_user_id uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  delete from public.banned_users where user_id = p_user_id;
  update auth.users set banned_until = null where id = p_user_id;
end;
$$;

-- Başkasının ban durumunu sorgulamak dışarıya kapalı; tetikleyici kendi yetkisiyle çağırır.
revoke all on function public.is_banned(uuid) from public, anon, authenticated;
revoke all on function public.admin_ban_user(uuid, text, uuid) from public, anon;
revoke all on function public.admin_unban_user(uuid) from public, anon;
grant execute on function public.admin_ban_user(uuid, text, uuid) to authenticated;
grant execute on function public.admin_unban_user(uuid) to authenticated;
