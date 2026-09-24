// Uygulama genelindeki sabitler. Burada yapılan değişiklikler Supabase RLS'teki karşılıklarıyla
// (is_unipd_verified) uyumlu tutulmalıdır.
//
// Admin yetkileri istemcide tutulmaz: public.admins tablosundaki satırlardan (role: 'admin' | 'superadmin') okunur.
// İlk superadmin SQL ile eklenir (bkz. supabase/migrations/0010_superadmin_by_uid.sql).

// UniPD kurumsal e-posta alan adları (öğrenci ve personel).
const UNIPD_EMAIL_PATTERN = /@(studenti\.)?unipd\.it$/i;

export const isUniPdEmail = (email?: string | null): boolean =>
  Boolean(email && UNIPD_EMAIL_PATTERN.test(email.trim()));

// Bir ilan bu kadar gün içinde sahibi tarafından teyit edilmezse (İlanlarım > "Süreyi Yenile") otomatik arşivlenir.
// supabase/migrations/0008_listing_confirmation_expiry.sql içindeki `interval '5 days'` ile uyumlu tutulmalıdır.
export const LISTING_CONFIRMATION_DAYS = 5;

// Gizlilik politikasında görünen veri sorumlusu bilgisi. Yayına almadan önce doldurulmalıdır
// (GDPR: veri sorumlusunun kimliği ve iletişim adresi kullanıcıya açıkça bildirilmelidir).
export const PRIVACY_CONTROLLER = {
  name: '',
  email: '',
};
