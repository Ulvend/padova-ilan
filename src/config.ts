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
