-- 1) Arşivli ilanlar yalnızca sahibine ve adminlere görünür (archive_reason, rented_price, tenant_type sızmasın).
-- 2) Kullanıcı adı biçimi ve ayrılmış adlar veritabanında zorunlu; profil adındaki görünmez/yön değiştiren karakterler temizlenir.
-- 3) Görüntülenme sayacı: aynı izleyici (oturum ya da IP) aynı ilan için 24 saatte bir sayılır.
-- 4) Admin işlem kaydı (admin_audit_log): yetki verme/alma, ban/ban kaldırma, admin ilan silme/güncelleme, şikayet kararları.

-- ============================================================
-- 1) Arşivli ilanlar
-- ============================================================
-- Yayında görünen ilan: arşivli değil ve teyit süresi dolmamış. Sahip ve adminler her şeyi görür.
-- (Süresi dolan ya da kiralanan/banlanan ilanın kendisi de böylece başkalarına görünmez.)

drop policy if exists "listings_select_public" on public.listings;
create policy "listings_select_public" on public.listings
  for select using (
    (select public.is_admin())
    or user_id = (select auth.uid())
    or (
      not is_archived
      and confirmed_at > now() - make_interval(days => public.listing_confirmation_days())
    )
  );

-- ============================================================
-- 2) Kullanıcı adı ve profil metni
-- ============================================================

-- Ayrılmış adların tek kaynağı (is_username_available ve CHECK kısıtı bunu kullanır).
create or replace function public.is_reserved_username(p_username text)
returns boolean language sql immutable as $$
  select lower(p_username) = any (array[
    'admin', 'administrator', 'root', 'support', 'moderator', 'padova', 'unipd',
    'staff', 'system', 'official', 'help', 'security'
  ]);
$$;

create or replace function public.is_username_available(p_username text)
returns boolean language sql stable security definer set search_path = public as $$
  select not public.is_reserved_username(p_username)
    and not exists (select 1 from public.profiles where lower(username) = lower(p_username));
$$;

-- İstemcideki kural (src/utils/username.ts) ile aynı: 3-20 karakter, küçük harf/rakam/nokta/alt çizgi,
-- baş ve sonda nokta/alt çizgi yok, art arda nokta/alt çizgi yok.
alter table public.profiles
  add constraint profiles_username_format check (
    username ~ '^[a-z0-9][a-z0-9._]{1,18}[a-z0-9]$'
    and username !~ '[._]{2}'
    and not public.is_reserved_username(username)
  );

-- Görünmez (sıfır genişlikli), yön değiştiren (RTL/LTR override) ve kontrol karakterleri ad/fakülteden silinir.
create or replace function public.sanitize_profile_text()
returns trigger language plpgsql set search_path = public as $$
declare
  bad constant text := '[­​-‏‪-‮⁠-⁯﻿]|[[:cntrl:]]';
begin
  new.name := btrim(regexp_replace(new.name, bad, '', 'g'));
  new.faculty := btrim(regexp_replace(new.faculty, bad, '', 'g'));
  if new.name = '' then
    raise exception 'invalid_name: name cannot be empty' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger profiles_sanitize_text
  before insert or update on public.profiles
  for each row execute function public.sanitize_profile_text();

-- Mevcut kayıtları temizle (koruma tetikleyicileri oturum gerektirmez; poster senkronu zaten çalışır).
update public.profiles
  set name = btrim(regexp_replace(name, '[­​-‏‪-‮⁠-⁯﻿]|[[:cntrl:]]', '', 'g'))
  where name ~ '[­​-‏‪-‮⁠-⁯﻿]|[[:cntrl:]]';

-- ============================================================
-- 3) Görüntülenme tekilleştirme
-- ============================================================
-- İzleyici anahtarı: giriş yapmışsa uid, değilse IP'nin özeti (Cloudflare'in eklediği cf-connecting-ip, yoksa
-- x-forwarded-for'un ilk adresi). Ham IP saklanmaz.
create table public.listing_view_dedupe (
  listing_id text not null references public.listings(id) on delete cascade,
  viewer text not null,
  viewed_at timestamptz not null default now(),
  primary key (listing_id, viewer)
);

alter table public.listing_view_dedupe enable row level security;
revoke all on table public.listing_view_dedupe from anon, authenticated;

create or replace function public.record_listing_view(p_listing_id text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_headers json;
  v_ip text;
  v_viewer text;
  v_rows integer;
begin
  select user_id into v_owner from public.listings where id = p_listing_id and not is_archived;
  if not found then
    return;
  end if;
  if v_owner is not null and v_owner = auth.uid() then
    return;
  end if;

  begin
    v_headers := nullif(current_setting('request.headers', true), '')::json;
  exception when others then
    v_headers := null;
  end;
  v_ip := coalesce(
    nullif(v_headers->>'cf-connecting-ip', ''),
    nullif(trim(split_part(coalesce(v_headers->>'x-forwarded-for', ''), ',', 1)), ''),
    'unknown'
  );
  v_viewer := coalesce('u:' || auth.uid()::text, 'ip:' || md5(v_ip));

  insert into public.listing_view_dedupe as d (listing_id, viewer)
    values (p_listing_id, v_viewer)
    on conflict (listing_id, viewer) do update set viewed_at = now()
      where d.viewed_at < now() - interval '24 hours';
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    return;
  end if;

  insert into public.listing_stats (listing_id, views) values (p_listing_id, 1)
    on conflict (listing_id) do update set views = public.listing_stats.views + 1;
end;
$$;

grant execute on function public.record_listing_view(text) to anon, authenticated;

create or replace function public.purge_listing_view_dedupe()
returns integer language plpgsql security definer set search_path = public as $$
declare
  purged integer;
begin
  delete from public.listing_view_dedupe where viewed_at < now() - interval '2 days';
  get diagnostics purged = row_count;
  return purged;
end;
$$;

revoke all on function public.purge_listing_view_dedupe() from public, anon, authenticated;

do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('purge-listing-view-dedupe', '15 3 * * *', 'select public.purge_listing_view_dedupe()');
exception when others then
  raise notice 'pg_cron zamanlaması kurulamadı (%). public.purge_listing_view_dedupe() elle zamanlanmalı.', sqlerrm;
end;
$$;

-- ============================================================
-- 4) Admin işlem kaydı
-- ============================================================
-- Yalnızca tetikleyiciler (security definer) yazar; kimse güncelleyemez/silemez (politika yok), yalnızca superadmin okur.
-- actor_id boşsa işlem service role / SQL editörü gibi oturumsuz bir bağlamdan gelmiştir.
create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  actor_id uuid,
  action text not null,
  target_type text not null,
  target_id text,
  details jsonb not null default '{}'::jsonb
);

create index admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
create index admin_audit_log_actor_idx on public.admin_audit_log (actor_id, created_at desc);

alter table public.admin_audit_log enable row level security;
revoke all on table public.admin_audit_log from anon, authenticated;
grant select on table public.admin_audit_log to authenticated;

create policy "admin_audit_log_select_superadmin" on public.admin_audit_log
  for select using ((select public.is_superadmin()));

create or replace function public.write_admin_audit(p_action text, p_target_type text, p_target_id text, p_details jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.admin_audit_log (actor_id, action, target_type, target_id, details)
  values (auth.uid(), p_action, p_target_type, p_target_id, coalesce(p_details, '{}'::jsonb));
$$;

revoke execute on function public.write_admin_audit(text, text, text, jsonb) from public, anon, authenticated;

-- Yetki verme / alma
create or replace function public.audit_admins()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.write_admin_audit('admin_granted', 'user', new.uid::text, to_jsonb(new));
  elsif tg_op = 'DELETE' then
    perform public.write_admin_audit('admin_revoked', 'user', old.uid::text, to_jsonb(old));
  end if;
  return null;
end;
$$;

create trigger audit_admins_changes
  after insert or delete on public.admins
  for each row execute function public.audit_admins();

-- Ban / ban kaldırma
create or replace function public.audit_banned_users()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.write_admin_audit('user_banned', 'user', new.user_id::text,
      jsonb_build_object('reason', new.reason, 'report_id', new.report_id));
  elsif tg_op = 'DELETE' then
    perform public.write_admin_audit('user_unbanned', 'user', old.user_id::text, '{}'::jsonb);
  end if;
  return null;
end;
$$;

create trigger audit_banned_users_changes
  after insert or delete on public.banned_users
  for each row execute function public.audit_banned_users();

-- Admin'in başkasının ilanını silmesi / değiştirmesi
create or replace function public.audit_listing_admin_actions()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  changed jsonb;
begin
  if not public.is_admin() then
    return null;
  end if;

  if tg_op = 'DELETE' then
    if old.user_id is distinct from auth.uid() then
      perform public.write_admin_audit('listing_deleted', 'listing', old.id,
        jsonb_build_object('title', old.title, 'owner_id', old.user_id));
    end if;
  elsif new.user_id is distinct from auth.uid() then
    select coalesce(jsonb_object_agg(k, jsonb_build_object('from', to_jsonb(old) -> k, 'to', to_jsonb(new) -> k)), '{}'::jsonb)
      into changed
      from jsonb_object_keys(to_jsonb(new)) as k
      where k in ('is_archived', 'archive_reason', 'has_video_tour', 'is_student_card_verified', 'price', 'title')
        and to_jsonb(new) -> k is distinct from to_jsonb(old) -> k;
    perform public.write_admin_audit('listing_updated', 'listing', new.id,
      jsonb_build_object('owner_id', new.user_id, 'changed', changed));
  end if;
  return null;
end;
$$;

create trigger audit_listings_admin_delete
  after delete on public.listings
  for each row execute function public.audit_listing_admin_actions();

create trigger audit_listings_admin_update
  after update on public.listings
  for each row
  when (old.* is distinct from new.*)
  execute function public.audit_listing_admin_actions();

-- Şikayet kararları
create or replace function public.audit_report_decision()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.write_admin_audit('report_status_changed', 'report', new.id::text,
    jsonb_build_object('from', old.status, 'to', new.status));
  return null;
end;
$$;

create trigger audit_reports_status
  after update of status on public.reports
  for each row
  when (old.status is distinct from new.status)
  execute function public.audit_report_decision();
