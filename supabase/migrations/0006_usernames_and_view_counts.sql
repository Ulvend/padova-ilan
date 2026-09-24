-- 1) Benzersiz, kullanıcının seçebildiği kullanıcı adları
-- 2) Doğru çalışan görüntülenme sayacı (listings tablosundan ayrı, realtime dışında)

-- ============================================================
-- Kullanıcı adları
-- ============================================================

-- İlanlardaki poster.username, profildeki kullanıcı adıyla senkron tutulur. Koruma tetikleyicisi
-- poster değişimini reddettiği için yalnızca "username" anahtarının profille eşleşen değişimine izin verilir.
create or replace function public.enforce_listing_owner_protected_keys()
returns trigger language plpgsql as $$
declare
  poster_ok boolean;
begin
  if public.is_admin() then
    return new;
  end if;
  poster_ok := new.poster is not distinct from old.poster
    or (
      (new.poster - 'username') = (old.poster - 'username')
      and new.poster->>'username' = (select username from public.profiles where id = old.user_id)
    );
  if new.user_id is distinct from old.user_id
    or new.is_student_card_verified is distinct from old.is_student_card_verified
    or not poster_ok
    or new.created_at is distinct from old.created_at then
    raise exception 'Cannot modify protected listing fields as owner';
  end if;
  return new;
end;
$$;

create or replace function public.sync_poster_username()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.username is distinct from old.username then
    update public.listings
      set poster = jsonb_set(poster, '{username}', to_jsonb(new.username))
      where user_id = new.id;
  end if;
  return new;
end;
$$;

create trigger profiles_sync_poster_username
  after update of username on public.profiles
  for each row execute function public.sync_poster_username();

-- E-postanın yerel kısmından türetilmiş eski kullanıcı adlarını e-postadan bağımsız bir değerle değiştir.
update public.profiles p
  set username = 'user_' || left(replace(p.id::text, '-', ''), 8)
  from public.profile_private pp
  where pp.user_id = p.id
    and lower(p.username) = lower(split_part(coalesce(pp.email, ''), '@', 1));

-- Kalan yinelenen adlarda en eski kayıt korunur, diğerleri yeniden adlandırılır.
update public.profiles p
  set username = 'user_' || left(replace(p.id::text, '-', ''), 8)
  from (
    select id, row_number() over (partition by lower(username) order by created_at, id) as rn
    from public.profiles
  ) d
  where d.id = p.id and d.rn > 1;

create unique index profiles_username_unique on public.profiles (lower(username));

-- Kayıt sırasında (oturum yokken) da kullanılabilirlik sorulabilsin diye anon'a açık.
create or replace function public.is_username_available(p_username text)
returns boolean language sql stable security definer set search_path = public as $$
  select lower(p_username) <> all (array['admin', 'administrator', 'root', 'support', 'moderator', 'padova', 'unipd'])
    and not exists (select 1 from public.profiles where lower(username) = lower(p_username));
$$;

grant execute on function public.is_username_available(text) to anon, authenticated;

-- ============================================================
-- Görüntülenme sayacı
-- ============================================================

-- listings tablosundaki her güncelleme tüm istemcilerde ilan listesini yeniden çektirdiği için
-- sayaç ayrı bir tabloda tutulur ve realtime yayınına eklenmez.
create table public.listing_stats (
  listing_id text primary key references public.listings(id) on delete cascade,
  views int not null default 0
);

insert into public.listing_stats (listing_id, views)
  select id, views from public.listings where views > 0;

alter table public.listing_stats enable row level security;

create policy "listing_stats_select_owner_or_admin" on public.listing_stats
  for select using (
    public.is_admin()
    or exists (select 1 from public.listings l where l.id = listing_id and l.user_id = auth.uid())
  );

-- Yalnızca bu fonksiyon üzerinden artar; sahibin kendi ilanı ve arşivli ilanlar sayılmaz.
create or replace function public.record_listing_view(p_listing_id text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
begin
  select user_id into v_owner from public.listings where id = p_listing_id and not is_archived;
  if not found then
    return;
  end if;
  if v_owner is not null and v_owner = auth.uid() then
    return;
  end if;
  insert into public.listing_stats (listing_id, views) values (p_listing_id, 1)
    on conflict (listing_id) do update set views = public.listing_stats.views + 1;
end;
$$;

grant execute on function public.record_listing_view(text) to anon, authenticated;
