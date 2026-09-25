-- Hesap silindiğinde mesaj ve şikayet saklama modeli (dolandırıcılığı önleme, GDPR md. 6(1)(f) meşru menfaat):
--   * Silinen hesabın gönderdiği/aldığı mesajlar silinmez; hesap kimliği boşaltılır (arayüzde "Silinmiş hesap") ve
--     karşı tarafın sohbetinde hesap silme tarihinden itibaren 90 gün saklanıp sonra silinir.
--   * Hakkında kullanıcı şikayeti yapılmış hesap silinse bile şikayet kaydı, şikayet tarihinden itibaren 90 gün saklanır.
-- Bu, 0018'de eklenen "on delete set null" değişikliğinin düzeltmesini de içerir: mesaj güncelleme tetikleyicisi
-- (yalnızca `read` değişebilir kuralı) hesap silme sırasındaki referans güncellemesini reddediyor ve hesap silmeyi
-- engelliyordu.

alter table public.messages
  add column anonymized_at timestamptz;

create index messages_anonymized_at_idx on public.messages (anonymized_at)
  where anonymized_at is not null;

create or replace function public.enforce_message_read_only_update()
returns trigger language plpgsql set search_path = public as $$
begin
  -- Oturumsuz bağlam (auth.uid() boş): hesap silme sırasındaki referans güncellemesi ya da service role.
  -- İstemciler her zaman oturumla gelir; bu dal onlara açık değildir. Yalnızca gönderici/alıcı boşaltılabilir.
  if auth.uid() is null then
    if new.text is distinct from old.text
      or new.listing_id is distinct from old.listing_id
      or new.subject is distinct from old.subject
      or new.created_at is distinct from old.created_at
      or new.read is distinct from old.read
      or (new.sender_id is distinct from old.sender_id and new.sender_id is not null)
      or (new.recipient_id is distinct from old.recipient_id and new.recipient_id is not null) then
      raise exception 'Only the account references of a message can be cleared';
    end if;
    if (new.sender_id is distinct from old.sender_id) or (new.recipient_id is distinct from old.recipient_id) then
      new.anonymized_at := coalesce(old.anonymized_at, now());
    end if;
    return new;
  end if;

  if auth.uid() <> old.recipient_id then
    raise exception 'Only the recipient can update a message';
  end if;
  if new.sender_id is distinct from old.sender_id
    or new.recipient_id is distinct from old.recipient_id
    or new.text is distinct from old.text
    or new.listing_id is distinct from old.listing_id
    or new.subject is distinct from old.subject
    or new.created_at is distinct from old.created_at
    or new.anonymized_at is distinct from old.anonymized_at
    or new.read is distinct from true then
    raise exception 'Only the read field may be set to true';
  end if;
  return new;
end;
$$;

-- 90 günlük saklama süresi dolan kayıtları siler. Mesajlar: hesap silinme tarihinden; şikayetler: şikayet tarihinden
-- (hedef hesap artık yoksa). purge_orphaned_messages adı eski zamanlamayla uyumlu kalsın diye korunur.
create or replace function public.purge_orphaned_messages()
returns integer language plpgsql security definer set search_path = public as $$
declare
  purged_messages integer;
  purged_reports integer;
begin
  delete from public.messages
    where anonymized_at is not null
      and anonymized_at < now() - interval '90 days';
  get diagnostics purged_messages = row_count;

  delete from public.reports r
    where r.target_user_id is not null
      and r.created_at < now() - interval '90 days'
      and not exists (select 1 from auth.users u where u.id = r.target_user_id);
  get diagnostics purged_reports = row_count;

  return purged_messages + purged_reports;
end;
$$;

revoke all on function public.purge_orphaned_messages() from public, anon, authenticated;
