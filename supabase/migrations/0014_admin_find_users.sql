-- Adminlerin bir kullanıcının kimliğini (UID) e-posta veya kullanıcı adıyla bulması.
-- UID artık normal kullanıcılara gösterilmiyor; admin yetkisi verirken kimlik buradan bulunur.
-- E-posta auth.users'tan okunur: profile_private.email kullanıcı tarafından değiştirilebilir,
-- auth.users'taki ise hesabın gerçek e-postasıdır. auth şemasına istemci erişemediği için
-- security definer; çağıran admin değilse hata verir.

create or replace function public.admin_find_users(search text)
returns table (id uuid, username text, name text, email text, created_at timestamptz)
language plpgsql stable security definer set search_path = public, auth as $$
declare
  q text := ltrim(lower(trim(coalesce(search, ''))), '@');
  pattern text;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if char_length(q) < 2 or char_length(q) > 320 then
    return;
  end if;
  -- LIKE joker karakterleri (%, _) ve kaçış karakteri aranan metinde düz karakter sayılır.
  pattern := '%' || replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  return query
    select u.id, p.username, p.name, u.email::text, u.created_at
    from auth.users u
    left join public.profiles p on p.id = u.id
    where lower(u.email) like pattern or lower(p.username) like pattern
    order by (lower(u.email) = q or lower(p.username) = q) desc, u.created_at desc
    limit 20;
end;
$$;

revoke all on function public.admin_find_users(text) from public, anon;
grant execute on function public.admin_find_users(text) to authenticated;
