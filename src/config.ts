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
// Tek kaynak sunucudaki public.listing_confirmation_days() fonksiyonudur (supabase/migrations/0016_data_layer_fixes.sql);
// istemci değeri ilanları ilk yüklerken oradan okur. Buradaki değer yalnızca okunamazsa kullanılan yedektir.
const DEFAULT_LISTING_CONFIRMATION_DAYS = 5;
let listingConfirmationDays = DEFAULT_LISTING_CONFIRMATION_DAYS;

export const getListingConfirmationDays = (): number => listingConfirmationDays;

export const setListingConfirmationDays = (days: number): void => {
  if (Number.isFinite(days) && days > 0) listingConfirmationDays = days;
};

// Gizlilik politikasında görünen veri sorumlusu bilgisi. Yayına almadan önce doldurulmalıdır
// (GDPR: veri sorumlusunun kimliği ve iletişim adresi kullanıcıya açıkça bildirilmelidir).
export const PRIVACY_CONTROLLER = {
  name: '',
  email: '',
};
