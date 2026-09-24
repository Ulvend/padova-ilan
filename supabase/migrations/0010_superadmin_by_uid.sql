-- Superadmin artık sabit bir e-posta adresine değil, public.admins tablosundaki role = 'superadmin' satırına bağlıdır.
-- Böylece yönetici e-postası ne istemci paketinde ne de SQL içinde tutulur.
--
-- Roller:
--   'superadmin' : diğer adminleri yönetir; yalnızca SQL (migration / SQL Editor) ile oluşturulur, arayüzden verilemez/alınamaz.
--   'admin'      : ilan ve kullanıcı yönetimi; superadmin tarafından arayüzden verilip alınabilir.

alter table public.admins
  add column role text not null default 'admin' check (role in ('admin', 'superadmin'));

create or replace function public.is_superadmin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.email_verified()
    and exists(select 1 from public.admins where uid = auth.uid() and role = 'superadmin');
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.email_verified()
    and exists(select 1 from public.admins where uid = auth.uid());
$$;

-- İstemci yalnızca 'admin' rolündeki satırları yazabilir/silebilir: superadmin satırı arayüzden
-- oluşturulamaz, yükseltilemez ve silinemez.
drop policy "admins_insert_superadmin" on public.admins;
drop policy "admins_update_superadmin" on public.admins;
drop policy "admins_delete_superadmin" on public.admins;

create policy "admins_insert_superadmin" on public.admins
  for insert with check (public.is_superadmin() and role = 'admin');

create policy "admins_update_superadmin" on public.admins
  for update using (public.is_superadmin() and role = 'admin')
  with check (public.is_superadmin() and role = 'admin');

create policy "admins_delete_superadmin" on public.admins
  for delete using (public.is_superadmin() and role = 'admin');

-- İlk (kurucu) superadmin: kullanıcı UID'siyle. Hesap yoksa (örn. sıfırdan kurulum) atlanır;
-- o durumda Supabase SQL Editor'dan şu komutla eklenir:
--   insert into public.admins (uid, note, granted_by, role)
--   values ('<KULLANICI_UUID>', 'Kurucu Superadmin', '<KULLANICI_UUID>', 'superadmin');
insert into public.admins (uid, note, granted_by, role)
select id, 'Kurucu Superadmin', id, 'superadmin'
from auth.users
where id = '83e22ad1-d1e4-48e9-906d-e3a4c8050803'
on conflict (uid) do update set role = 'superadmin';
