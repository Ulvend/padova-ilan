# Padova İlan

Padova'daki (UniPD) öğrenciler için oda ve ev ilanı platformu. React + Vite + TypeScript, veri ve kimlik doğrulama için Firebase (Auth, Firestore, Storage, AI Logic).

## Geliştirme

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm lint       # TypeScript kontrolü
pnpm build
```

Firebase istemci ayarları `firebase-applet-config.json` dosyasındadır (web yapılandırması, gizli değildir).

## Kimlik doğrulama ve UniPD rozeti

- Giriş yöntemleri: e-posta + şifre, Google, Apple (Firebase Auth).
- E-posta ile kayıt olanlara doğrulama linki gönderilir. **İlan vermek ve mesaj göndermek için doğrulanmış e-posta gerekir.**
- **UniPD Onaylı rozeti**, hesabın e-postası doğrulanmış bir `@studenti.unipd.it` / `@unipd.it` adresi olduğunda verilir.
  Google vb. ile giriş yapan kullanıcılar Profil sayfasından UniPD adreslerini doğrulayarak rozet alabilir
  (link tıklanınca hesabın e-postası UniPD adresi olur).
- Rozet istemcide değil, `firestore.rules` içinde token'daki doğrulanmış e-postaya göre zorlanır; sahte rozet yazılamaz.

## Yetkiler

- **Ana admin:** `src/config.ts` → `SUPERADMIN_EMAILS` (ve `firestore.rules` → `isSuperAdmin`). İkisi aynı tutulmalı.
- **Adminler:** Ana admin, Admin Paneli'nden kullanıcının UID'sini (Profil sayfasında görünür) girerek yetki verir.
  Bu, Firestore'da `admins/{uid}` belgesi oluşturur.

## Veri modeli (Firestore)

| Koleksiyon | İçerik | Kim okur |
|---|---|---|
| `users/{uid}` | Herkese açık profil (ad, fakülte, fotoğraf, `unipdVerified`) | Giriş yapmış herkes |
| `users/{uid}/private/profile` | E-posta, telefon, favoriler | Sahibi ve adminler |
| `admins/{uid}` | Admin yetkisi | Sahibi ve adminler |
| `listings/{id}` | İlanlar (`isArchived` ile geçmiş ilanlar) | Herkes |
| `messages/{id}` | İki kişi arasındaki mesajlar (`participants`) | Yalnızca katılımcılar |
| `notifications/{id}` | Kullanıcı bildirimleri | Yalnızca sahibi |

İlan fotoğrafları Storage'da `listing_photos/{uid}/`, profil fotoğrafları `profile_photos/{uid}/` altındadır.

## Yayına alma

Kurallar kodla birlikte değişir; her değişiklikte yayınlanmalıdır:

```bash
firebase deploy --only firestore:rules,storage
```

Firebase konsolunda açık olması gerekenler:

- Authentication → Sign-in method: **Email/Password**, Google (ve isteniyorsa Apple)
- Authentication → Settings → Authorized domains: uygulamanın alan adı
- AI Logic → **Gemini Developer API** (çeviri için; kapalıysa uygulama yerel sözlüğe düşer)
- Önerilir: **App Check** (AI Logic ve Firestore'u kötüye kullanıma karşı korur)
