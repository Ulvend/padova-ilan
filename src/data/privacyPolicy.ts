import type { Language } from '../types';

// Gizlilik ve çerez politikası metni. Türkçe, İngilizce ve İtalyanca yazılıdır; diğer diller İngilizceye düşer.
// Bu metin bilgilendirme amaçlıdır ve yayına almadan önce bir hukuk danışmanı tarafından gözden geçirilmelidir.
// Veri sorumlusunun adı ve iletişim adresi src/config.ts içindeki PRIVACY_CONTROLLER alanından gelir.

export interface PolicySection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface PolicyContent {
  title: string;
  updated: string;
  intro: string;
  sections: PolicySection[];
}

const TR: PolicyContent = {
  title: 'Gizlilik ve Çerez Politikası',
  updated: 'Son güncelleme',
  intro:
    'Padova Student Housing, Padova\'daki öğrencilerin oda ve daire ilanlarını paylaşmasını sağlar. Hizmet, Avrupa Birliği Genel Veri Koruma Tüzüğü (GDPR) ve İtalyan veri koruma mevzuatı kapsamındadır. Bu sayfa hangi verileri neden işlediğimizi ve haklarını açıklar.',
  sections: [
    {
      heading: '1. Hangi verileri işliyoruz?',
      bullets: [
        'Hesap bilgilerin: e-posta adresi, ad, kullanıcı adı, bölümün, isteğe bağlı biyografi, profil fotoğrafı ve telefon numarası.',
        'Yayınladığın içerik: ilanların, ilan fotoğrafların ve açıklamaların. İlanlar ve ilan sahibinin adı/kullanıcı adı herkese açıktır.',
        'İletişim: diğer kullanıcılarla mesajların, bildirimlerin ve şikayetlerin.',
        'Kullanım verileri: favorilerin, görüntülediğin ilanlar (görüntülenme sayacı için) ve sunucu güvenlik günlükleri (IP adresi, zaman damgası).',
      ],
    },
    {
      heading: '2. Neden ve hangi hukuki dayanakla?',
      bullets: [
        'Hizmeti sunmak (hesap, ilan, mesajlaşma): GDPR md. 6(1)(b) – sözleşmenin ifası.',
        'Güvenlik, spam ve dolandırıcılıkla mücadele, şikayetlerin incelenmesi: md. 6(1)(f) – meşru menfaat.',
        'İsteğe bağlı telefon numarası ve profil bilgileri: md. 6(1)(a) – rıza. Rızanı istediğin an geri çekebilirsin.',
      ],
    },
    {
      heading: '3. Verilerin kimlerle paylaşılır?',
      paragraphs: ['Verilerini satmıyoruz. Hizmeti çalıştırmak için şu işleyicileri kullanıyoruz:'],
      bullets: [
        'Supabase (veritabanı, kimlik doğrulama, dosya depolama): veriler Avrupa Birliği\'ndeki (Frankfurt) sunucularda tutulur.',
        'Google (Gemini): sohbette "çevir" özelliğini kullandığında yalnızca çevrilecek mesaj metni çeviri için Google\'a gönderilir.',
        'E-posta gönderim sağlayıcısı: doğrulama ve şifre sıfırlama e-postaları için.',
        'OpenStreetMap: harita görüntüleri ve adres arama; tarayıcının IP adresi ve aranan adres OpenStreetMap sunucularına ulaşır.',
        'Diğer kullanıcılar: ilanların, ad ve kullanıcı adın herkese açıktır; mesajların yalnızca yazıştığın kişiye görünür.',
      ],
    },
    {
      heading: '4. Çerezler ve tarayıcıda saklanan veriler',
      paragraphs: [
        'Bu site çerez (cookie) kullanmaz; reklam, izleme veya analiz aracı yoktur. Bu nedenle bir çerez onay bandı gerekmez.',
        'Sitenin çalışması için tarayıcının yerel depolamasında (localStorage) şunlar tutulur: oturum bilgin, dil tercihin, favorilerin, ilan listesi ve harita adresleri için önbellek, çevirilerin önbelleği, yarım kalan ilan taslağın ve görüntülediğin ilanların kaydı. Bunların hiçbiri reklam amacıyla kullanılmaz.',
        'Aşağıdaki "Tarayıcıda saklanan veriler" bölümünden bunları görebilir ve istediğin an temizleyebilirsin.',
      ],
    },
    {
      heading: '5. Ne kadar saklıyoruz?',
      bullets: [
        'Verilerin, hesabın açık olduğu sürece saklanır.',
        'Hesabını sildiğinde profilin, ilanların ve fotoğrafların, mesajların, bildirimlerin, favorilerin ve şikayetlerin kalıcı olarak silinir.',
        'Sunucu güvenlik günlükleri, altyapı sağlayıcısının belirlediği kısa süre boyunca tutulur.',
      ],
    },
    {
      heading: '6. Haklarını nasıl kullanırsın?',
      bullets: [
        'Erişim ve düzeltme: profil bilgilerini Profil Ayarları\'ndan görebilir ve değiştirebilirsin.',
        'Silme (unutulma hakkı): Profil Ayarları > Hesap bölümünden "Hesabımı Sil" ile hesabını ve verilerini tek adımda silebilirsin.',
        'İtiraz, kısıtlama ve veri taşınabilirliği (verilerinin bir kopyası): bize yazarak talep edebilirsin.',
        'Şikayet hakkı: veri korumasıyla ilgili bir şikayetin varsa İtalyan veri koruma kurumuna (Garante per la protezione dei dati personali, garanteprivacy.it) başvurabilirsin.',
      ],
    },
    {
      heading: '7. Değişiklikler',
      paragraphs: ['Bu politika güncellenebilir; önemli değişiklikler bu sayfada duyurulur.'],
    },
  ],
};

const EN: PolicyContent = {
  title: 'Privacy & Cookie Policy',
  updated: 'Last updated',
  intro:
    'Padova Student Housing lets students in Padova share room and apartment listings. The service is subject to the EU General Data Protection Regulation (GDPR) and Italian data protection law. This page explains what data we process, why, and what your rights are.',
  sections: [
    {
      heading: '1. What data do we process?',
      bullets: [
        'Your account details: email address, name, username, department, optional bio, profile photo and phone number.',
        'Content you publish: your listings, listing photos and descriptions. Listings and the poster\'s name/username are public.',
        'Communication: your messages with other users, notifications and reports.',
        'Usage data: your favorites, the listings you view (for the view counter) and server security logs (IP address, timestamp).',
      ],
    },
    {
      heading: '2. Why, and on what legal basis?',
      bullets: [
        'To provide the service (account, listings, messaging): GDPR Art. 6(1)(b) – performance of a contract.',
        'Security, fighting spam and fraud, reviewing reports: Art. 6(1)(f) – legitimate interests.',
        'Optional phone number and profile details: Art. 6(1)(a) – consent, which you can withdraw at any time.',
      ],
    },
    {
      heading: '3. Who do we share data with?',
      paragraphs: ['We do not sell your data. We rely on these processors to run the service:'],
      bullets: [
        'Supabase (database, authentication, file storage): data is kept on servers in the European Union (Frankfurt).',
        'Google (Gemini): when you use "translate" in chat, only the message text to be translated is sent to Google.',
        'Email delivery provider: for verification and password-reset emails.',
        'OpenStreetMap: map images and address search; your browser\'s IP address and the searched address reach OpenStreetMap servers.',
        'Other users: your listings, name and username are public; your messages are visible only to the person you write with.',
      ],
    },
    {
      heading: '4. Cookies and data stored in your browser',
      paragraphs: [
        'This site does not use cookies; there is no advertising, tracking or analytics tool. A cookie consent banner is therefore not required.',
        'To work, the site keeps the following in your browser\'s local storage (localStorage): your sign-in session, language preference, favorites, caches for the listing list and map addresses, a cache of translations, your unfinished listing draft and a record of the listings you viewed. None of it is used for advertising.',
        'You can see all of this and clear it at any time in the "Data stored in your browser" section below.',
      ],
    },
    {
      heading: '5. How long do we keep it?',
      bullets: [
        'Your data is kept for as long as your account is open.',
        'When you delete your account, your profile, listings and photos, messages, notifications, favorites and reports are permanently deleted.',
        'Server security logs are kept for the short period set by the infrastructure provider.',
      ],
    },
    {
      heading: '6. How to exercise your rights',
      bullets: [
        'Access and rectification: you can view and edit your profile in Profile Settings.',
        'Erasure (right to be forgotten): use "Delete my account" under Profile Settings > Account to delete your account and data in one step.',
        'Objection, restriction and data portability (a copy of your data): contact us to request it.',
        'Right to complain: if you have a data protection complaint you can contact the Italian data protection authority (Garante per la protezione dei dati personali, garanteprivacy.it).',
      ],
    },
    {
      heading: '7. Changes',
      paragraphs: ['This policy may be updated; significant changes will be announced on this page.'],
    },
  ],
};

const IT: PolicyContent = {
  title: 'Informativa su privacy e cookie',
  updated: 'Ultimo aggiornamento',
  intro:
    'Padova Student Housing permette agli studenti di Padova di condividere annunci di stanze e appartamenti. Il servizio è soggetto al Regolamento generale sulla protezione dei dati dell\'UE (GDPR) e alla normativa italiana. Questa pagina spiega quali dati trattiamo, perché e quali sono i tuoi diritti.',
  sections: [
    {
      heading: '1. Quali dati trattiamo?',
      bullets: [
        'I dati del tuo account: indirizzo email, nome, nome utente, dipartimento, biografia facoltativa, foto profilo e numero di telefono.',
        'I contenuti che pubblichi: annunci, foto e descrizioni. Gli annunci e il nome/nome utente di chi li pubblica sono pubblici.',
        'Comunicazioni: messaggi con altri utenti, notifiche e segnalazioni.',
        'Dati d\'uso: i preferiti, gli annunci visualizzati (per il contatore) e i log di sicurezza del server (indirizzo IP, data e ora).',
      ],
    },
    {
      heading: '2. Perché e su quale base giuridica?',
      bullets: [
        'Per fornire il servizio (account, annunci, messaggi): art. 6(1)(b) GDPR – esecuzione di un contratto.',
        'Sicurezza, contrasto a spam e frodi, esame delle segnalazioni: art. 6(1)(f) – legittimo interesse.',
        'Numero di telefono facoltativo e dati del profilo: art. 6(1)(a) – consenso, revocabile in qualsiasi momento.',
      ],
    },
    {
      heading: '3. Con chi condividiamo i dati?',
      paragraphs: ['Non vendiamo i tuoi dati. Per far funzionare il servizio ci affidiamo a questi responsabili del trattamento:'],
      bullets: [
        'Supabase (database, autenticazione, archiviazione file): i dati sono conservati su server nell\'Unione europea (Francoforte).',
        'Google (Gemini): quando usi "traduci" in chat, a Google viene inviato solo il testo del messaggio da tradurre.',
        'Fornitore di invio email: per le email di verifica e di reimpostazione della password.',
        'OpenStreetMap: immagini della mappa e ricerca indirizzi; l\'indirizzo IP del browser e l\'indirizzo cercato raggiungono i server di OpenStreetMap.',
        'Altri utenti: annunci, nome e nome utente sono pubblici; i messaggi sono visibili solo alla persona con cui scrivi.',
      ],
    },
    {
      heading: '4. Cookie e dati salvati nel browser',
      paragraphs: [
        'Questo sito non usa cookie; non ci sono strumenti pubblicitari, di tracciamento o di analisi. Un banner di consenso ai cookie non è quindi necessario.',
        'Per funzionare, il sito salva nella memoria locale del browser (localStorage): la sessione di accesso, la preferenza di lingua, i preferiti, le cache dell\'elenco annunci e degli indirizzi sulla mappa, la cache delle traduzioni, la bozza dell\'annuncio non completato e l\'elenco degli annunci visualizzati. Nulla di questo è usato per la pubblicità.',
        'Puoi vedere e cancellare tutto questo in qualsiasi momento nella sezione "Dati salvati nel browser" qui sotto.',
      ],
    },
    {
      heading: '5. Per quanto tempo li conserviamo?',
      bullets: [
        'I tuoi dati sono conservati finché il tuo account resta attivo.',
        'Quando elimini l\'account, profilo, annunci e foto, messaggi, notifiche, preferiti e segnalazioni vengono eliminati definitivamente.',
        'I log di sicurezza del server sono conservati per il breve periodo stabilito dal fornitore dell\'infrastruttura.',
      ],
    },
    {
      heading: '6. Come esercitare i tuoi diritti',
      bullets: [
        'Accesso e rettifica: puoi vedere e modificare il profilo in Impostazioni profilo.',
        'Cancellazione (diritto all\'oblio): usa "Elimina account" in Impostazioni profilo > Account per eliminare account e dati in un solo passaggio.',
        'Opposizione, limitazione e portabilità (copia dei dati): contattaci per richiederla.',
        'Diritto di reclamo: per un reclamo sulla protezione dei dati puoi rivolgerti al Garante per la protezione dei dati personali (garanteprivacy.it).',
      ],
    },
    {
      heading: '7. Modifiche',
      paragraphs: ['Questa informativa può essere aggiornata; le modifiche importanti saranno comunicate in questa pagina.'],
    },
  ],
};

const CONTENT: Partial<Record<Language, PolicyContent>> = { tr: TR, en: EN, it: IT };

/** Kullanıcının dilinde politika metni; yoksa İngilizce. */
export const getPrivacyPolicy = (lang: Language): { content: PolicyContent; isFallback: boolean } => {
  const content = CONTENT[lang];
  return content ? { content, isFallback: false } : { content: EN, isFallback: true };
};

// Son güncelleme tarihi (ISO). Metin değiştiğinde güncellenmelidir.
export const PRIVACY_POLICY_UPDATED = '2026-09-25';
