-- listings tablosu herkese açık okunur; ilan sahibinin telefonu (profile_private'ta korunan veri)
-- poster JSON'una yazılmış olabilir. Mevcut kayıtlardan temizle ve bir daha yazılmasını engelle.

-- Koruma tetikleyicisi poster değişimini reddettiği için temizlik sırasında geçici kapatılır.
alter table public.listings disable trigger listings_protect_owner_fields;
update public.listings set poster = poster - 'phone' where poster ? 'phone';
alter table public.listings enable trigger listings_protect_owner_fields;

create or replace function public.strip_poster_phone()
returns trigger language plpgsql as $$
begin
  new.poster := new.poster - 'phone';
  return new;
end;
$$;

create trigger listings_strip_poster_phone
  before insert or update on public.listings
  for each row execute function public.strip_poster_phone();
