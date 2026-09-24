-- Profil ilk kez oluşturulurken (ilk girişte upsert) da ilanlardaki poster.username profille eşitlensin,
-- ve tetikleyici eklenmeden önce oluşmuş sapmalar bir kez düzeltilsin.

create or replace function public.sync_poster_username()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.username is distinct from old.username then
    update public.listings
      set poster = jsonb_set(poster, '{username}', to_jsonb(new.username))
      where user_id = new.id and poster->>'username' is distinct from new.username;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_sync_poster_username on public.profiles;
create trigger profiles_sync_poster_username
  after insert or update of username on public.profiles
  for each row execute function public.sync_poster_username();

-- Mevcut sapmaları düzelt.
update public.listings l
  set poster = jsonb_set(l.poster, '{username}', to_jsonb(p.username))
  from public.profiles p
  where p.id = l.user_id and l.poster->>'username' is distinct from p.username;
