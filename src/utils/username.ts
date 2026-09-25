// Herkese açık kullanıcı adı e-posta adresinden türetilmemeli (e-postanın yerel kısmını ifşa eder).
const slug = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 12);

/** 3-20 karakter; küçük harf, rakam, nokta ve alt çizgi. Başta ve sonda nokta/alt çizgi olamaz. */
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._]{1,18}[a-z0-9]$/;

export const normalizeUsername = (value: string): string => value.trim().toLowerCase();

export const isValidUsername = (value: string): boolean => USERNAME_PATTERN.test(value) && !/[._]{2}/.test(value);

/** Kullanıcı ad soyadından ve hesap kimliğinden e-postadan bağımsız bir varsayılan kullanıcı adı üretir. */
export const defaultUsername = (displayName: string, uid: string): string =>
  `${slug(displayName) || 'student'}_${uid.replace(/-/g, '').slice(0, 4)}`;

/** Kayıtlı kullanıcı adını döner; yoksa varsayılan üretir. */
export const resolveUsername = (stored: string | undefined, displayName: string, uid: string): string =>
  stored || defaultUsername(displayName, uid);
