// Uygulama genelindeki sabitler. Burada yapılan değişiklikler firestore.rules
// içindeki karşılıklarıyla (isSuperAdmin, isUniPd) uyumlu tutulmalıdır.

// Ana admin (super admin) e-postaları. Yalnızca doğrulanmış e-posta ile giriş
// yapıldığında geçerlidir; diğer adminler Firestore'daki `admins` koleksiyonundan gelir.
export const SUPERADMIN_EMAILS = ['cnkborasimsek@gmail.com'];

// UniPD kurumsal e-posta alan adları (öğrenci ve personel).
const UNIPD_EMAIL_PATTERN = /@(studenti\.)?unipd\.it$/i;

export const isUniPdEmail = (email?: string | null): boolean =>
  Boolean(email && UNIPD_EMAIL_PATTERN.test(email.trim()));

export const isSuperAdminEmail = (email?: string | null): boolean =>
  Boolean(email && SUPERADMIN_EMAILS.includes(email.trim().toLowerCase()));

// Bir ilan bu kadar gün içinde sahibi tarafından teyit edilmezse (İlanlarım > "Süreyi Yenile") otomatik arşivlenir.
// supabase/migrations/0008_listing_confirmation_expiry.sql içindeki `interval '5 days'` ile uyumlu tutulmalıdır.
export const LISTING_CONFIRMATION_DAYS = 5;
