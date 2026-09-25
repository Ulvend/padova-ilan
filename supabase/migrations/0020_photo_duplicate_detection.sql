-- Çalıntı fotoğraf tespiti: yüklenen ilan fotoğrafının görsel özeti (perceptual hash, dHash) saklanır; başka bir
-- kullanıcının fotoğrafına çok benzeyen (yeniden boyutlandırılmış, sıkıştırılmış ya da aynalanmış) bir fotoğraf
-- bulunursa admin inceleme listesine (photo_duplicate_flags) düşer ve yükleyene uyarı gösterilir.
--
-- Özet istemcide hesaplanır (sunucu görseli çözmez); bu yüzden sistem, arayüzü kullanan sıradan dolandırıcıyı yakalar,
-- API'yi elle çağıran teknik bir saldırganı engellemez. Yükleme reddedilmez: aynı odayı paylaşan ev arkadaşları ya da
-- emlakçılar meşru olarak aynı fotoğrafı kullanabilir; karar admindedir.

create table public.listing_photo_hashes (
  path text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  hash bit(64) not null,
  hash_flipped bit(64) not null,
  created_at timestamptz not null default now()
);

create index listing_photo_hashes_owner_idx on public.listing_photo_hashes (owner_id);

alter table public.listing_photo_hashes enable row level security;
revoke all on table public.listing_photo_hashes from anon, authenticated;

create table public.photo_duplicate_flags (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  path text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  matched_path text not null,
  matched_owner_id uuid not null references auth.users(id) on delete cascade,
  distance int not null,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  unique (path, matched_path)
);

create index photo_duplicate_flags_status_idx on public.photo_duplicate_flags (status, created_at desc);

alter table public.photo_duplicate_flags enable row level security;
revoke all on table public.photo_duplicate_flags from anon, authenticated;
grant select on table public.photo_duplicate_flags to authenticated;
grant update (status) on table public.photo_duplicate_flags to authenticated;

create policy "photo_duplicate_flags_select_admin" on public.photo_duplicate_flags
  for select using ((select public.is_admin()));

create policy "photo_duplicate_flags_update_admin" on public.photo_duplicate_flags
  for update using ((select public.is_admin())) with check ((select public.is_admin()));

-- Yüklenen fotoğrafın özetini kaydeder ve başka kullanıcıların fotoğraflarıyla karşılaştırır.
-- Dönüş: bulunan benzer fotoğraf sayısı. Yol, çağıranın kendi klasöründe ve gerçekten yüklenmiş olmalıdır.
-- Benzerlik: 64 bitlik özetlerde en fazla 6 bit fark (aynalanmış hâl de denenir). Silinmiş fotoğraflar sayılmaz.
create or replace function public.register_listing_photo(p_path text, p_hash text, p_hash_flipped text)
returns integer language plpgsql security definer set search_path = public, storage as $$
declare
  uid uuid := auth.uid();
  h bit(64);
  hf bit(64);
  m record;
  matches integer := 0;
begin
  if uid is null then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_hash !~ '^[01]{64}$' or p_hash_flipped !~ '^[01]{64}$' then
    raise exception 'invalid_hash' using errcode = '22023';
  end if;
  if (storage.foldername(p_path))[1] is distinct from uid::text then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if not exists (select 1 from storage.objects where bucket_id = 'listing_photos' and name = p_path) then
    raise exception 'photo_not_found' using errcode = '22023';
  end if;

  h := p_hash::bit(64);
  hf := p_hash_flipped::bit(64);

  insert into public.listing_photo_hashes (path, owner_id, hash, hash_flipped)
    values (p_path, uid, h, hf)
    on conflict (path) do update set hash = excluded.hash, hash_flipped = excluded.hash_flipped;

  for m in
    select x.path, x.owner_id,
           least(bit_count(x.hash # h), bit_count(x.hash_flipped # h)) as dist
    from public.listing_photo_hashes x
    where x.owner_id <> uid
      and least(bit_count(x.hash # h), bit_count(x.hash_flipped # h)) <= 6
      and exists (select 1 from storage.objects o where o.bucket_id = 'listing_photos' and o.name = x.path)
    order by dist, x.created_at
    limit 5
  loop
    insert into public.photo_duplicate_flags (path, owner_id, matched_path, matched_owner_id, distance)
      values (p_path, uid, m.path, m.owner_id, m.dist)
      on conflict (path, matched_path) do nothing;
    matches := matches + 1;
  end loop;

  return matches;
end;
$$;

revoke execute on function public.register_listing_photo(text, text, text) from public, anon;
grant execute on function public.register_listing_photo(text, text, text) to authenticated;

-- İnceleme kararı admin işlem kaydına yazılır.
create or replace function public.audit_photo_flag_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.write_admin_audit('photo_flag_reviewed', 'photo_flag', new.id::text,
    jsonb_build_object('from', old.status, 'to', new.status, 'owner_id', new.owner_id, 'matched_owner_id', new.matched_owner_id));
  return null;
end;
$$;

create trigger audit_photo_flags_status
  after update of status on public.photo_duplicate_flags
  for each row
  when (old.status is distinct from new.status)
  execute function public.audit_photo_flag_review();
