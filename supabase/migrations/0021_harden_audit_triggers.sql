-- 0019/0020'de eklenen tetikleyici fonksiyonları RPC ile çağrılabilir olmamalı (tetikleyicinin çalışması için EXECUTE gerekmez).
revoke execute on function public.audit_admins() from public, anon, authenticated;
revoke execute on function public.audit_banned_users() from public, anon, authenticated;
revoke execute on function public.audit_listing_admin_actions() from public, anon, authenticated;
revoke execute on function public.audit_report_decision() from public, anon, authenticated;
revoke execute on function public.audit_photo_flag_review() from public, anon, authenticated;

-- Sabit liste döndüren fonksiyon için arama yolu sabitlenir.
alter function public.is_reserved_username(text) set search_path = public;
