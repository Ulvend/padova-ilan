-- Şikayet kategorisi: "Ben bu evin sahibiyim, devirden/kiralamadan haberim yok" (ev sahibi bildirimi).
-- Ev sahibinin adı ve iletişim bilgisi açıklamada gelir; bu yüzden "Diğer" gibi açıklama zorunludur.
-- Şikayetleri yalnızca yöneticiler okur (RLS: reports_select_admin), bilgiler başka kullanıcılara görünmez.
alter table public.reports drop constraint reports_category_check;
alter table public.reports
  add constraint reports_category_check
    check (category in ('scam', 'fake_photo', 'inappropriate', 'spam', 'landlord', 'other'));

alter table public.reports drop constraint reports_other_needs_reason;
alter table public.reports
  add constraint reports_other_needs_reason
    check (category not in ('other', 'landlord') or char_length(btrim(reason)) > 0);
