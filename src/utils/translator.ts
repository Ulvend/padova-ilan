import { Language } from '../types';
import { translateWithGemini } from '../services/geminiService';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'tr', name: 'Türkçe', nativeName: 'Türkçe', flag: 'TR' },
  { code: 'it', name: 'Italiano', nativeName: 'Italiano', flag: 'IT' },
  { code: 'en', name: 'English', nativeName: 'English', flag: 'EN' },
  { code: 'de', name: 'Deutsch', nativeName: 'Deutsch', flag: 'DE' },
  { code: 'ru', name: 'Русский', nativeName: 'Русский', flag: 'RU' },
  { code: 'hi', name: 'हिन्दी', nativeName: 'हिन्दी', flag: 'HI' },
];

export const LANGUAGE_NAMES: Record<Language, string> = {
  tr: 'Türkçe',
  it: 'Italiano',
  en: 'English',
  de: 'Deutsch',
  ru: 'Русский',
  hi: 'हिन्दी',
};

// Target translation action labels per site language
export const TRANSLATE_ACTION_LABELS: Record<Language, Record<Language, string>> = {
  tr: {
    tr: 'Türkçeye Çevir',
    it: 'İtalyancaya Çevir',
    en: 'İngilizceye Çevir',
    de: 'Almancaya Çevir',
    ru: 'Rusçaya Çevir',
    hi: 'Hintçeye Çevir',
  },
  it: {
    tr: 'Traduci in Turco',
    it: 'Traduci in Italiano',
    en: 'Traduci in Inglese',
    de: 'Traduci in Tedesco',
    ru: 'Traduci in Russo',
    hi: 'Traduci in Hindi',
  },
  en: {
    tr: 'Translate to Turkish',
    it: 'Translate to Italian',
    en: 'Translate to English',
    de: 'Translate to German',
    ru: 'Translate to Russian',
    hi: 'Translate to Hindi',
  },
  de: {
    tr: 'Auf Türkisch übersetzen',
    it: 'Auf Italienisch übersetzen',
    en: 'Auf Englisch übersetzen',
    de: 'Auf Deutsch übersetzen',
    ru: 'Auf Russisch übersetzen',
    hi: 'Auf Hindi übersetzen',
  },
  ru: {
    tr: 'Перевести на турецкий',
    it: 'Перевести на итальянский',
    en: 'Перевести на английский',
    de: 'Перевести на немецкий',
    ru: 'Перевести на русский',
    hi: 'Перевести на хинди',
  },
  hi: {
    tr: 'तुर्की में अनुवाद करें',
    it: 'इतालवी में अनुवाद करें',
    en: 'अंग्रेजी में अनुवाद करें',
    de: 'जर्मन में अनुवाद करें',
    ru: 'रूसी में अनुवाद करें',
    hi: 'हिन्दी में अनुवाद करें',
  },
};

// Known high-fidelity translations dictionary for Padova student housing dialogue
const PRESET_TRANSLATIONS: Record<string, Partial<Record<Language, string>>> = {
  // Giulia - Room availability & contract
  "ciao cenk! la nostra stanza è disponibile per l'inizio del semestre. siamo vicinissimi alla facoltà di medicina. il contratto è ufficiale canone concordato.": {
    it: "Ciao Cenk! La nostra stanza è disponibile per l'inizio del semestre. Siamo vicinissimi alla facoltà di medicina. Il contratto è ufficiale Canone Concordato.",
    tr: 'Selam Cenk! Odamız dönem başı için müsait. Tıp fakültesine çok yakınız. Sözleşme resmi Canone Concordato.',
    en: 'Hi Cenk! Our room is available for the semester start. We are very close to the medical school. The contract is official Canone Concordato.',
    de: 'Hallo Cenk! Unser Zimmer ist für den Semesterbeginn verfügbar. Wir sind ganz in der Nähe der medizinischen Fakultät. Der Vertrag ist ein offizieller Canone Concordato.',
    ru: 'Привет Дженк! Наша комната свободна к началу семестра. Мы совсем рядом с медицинским факультетом. Официальный договор Canone Concordato.',
    hi: 'नमस्ते Cenk! हमारा कमरा सेमेस्टर की शुरुआत के लिए उपलब्ध है। हम मेडिकल फैकल्टी के बहुत करीब हैं। अनुबंध आधिकारिक Canone Concordato है।',
  },
  'selam cenk! odamız dönem başı için müsait. tıp fakültesine çok yakınız. sözleşme resmi canone concordato.': {
    it: "Ciao Cenk! La nostra stanza è disponibile per l'inizio del semestre. Siamo vicinissimi alla facoltà di medicina. Il contratto è ufficiale Canone Concordato.",
    tr: 'Selam Cenk! Odamız dönem başı için müsait. Tıp fakültesine çok yakınız. Sözleşme resmi Canone Concordato.',
    en: 'Hi Cenk! Our room is available for the semester start. We are very close to the medical school. The contract is official Canone Concordato.',
    de: 'Hallo Cenk! Unser Zimmer ist für den Semesterbeginn verfügbar. Wir sind ganz in der Nähe der medizinischen Fakultät. Der Vertrag ist ein offizieller Canone Concordato.',
    ru: 'Привет Дженк! Наша комната свободна к началу семестра. Мы совсем рядом с медицинским факультетом. Официальный договор Canone Concordato.',
    hi: 'नमस्ते Cenk! हमारा कमरा सेमेस्टर की शुरुआत के लिए उपलब्ध है। हम मेडिकल फैकल्टी के बहुत करीब हैं। अनुबंध आधिकारिक Canone Concordato है।',
  },

  // Giulia - Video tour & in person
  "se sei disponibile, posso mostrarti la stanza nei giorni feriali dopo le 17:00 tramite videochiamata o di persona.": {
    it: "Se sei disponibile, posso mostrarti la stanza nei giorni feriali dopo le 17:00 tramite videochiamata o di persona.",
    tr: 'Eğer uygunsan hafta içi 17:00 sonrasında video görüşmeyle veya yüz yüze odayı gösterebilirim.',
    en: 'If you are free, I can show you the room on weekdays after 17:00 via video call or in person.',
    de: 'Wenn du Zeit hast, kann ich dir das Zimmer wochentags nach 17:00 Uhr per Videoanruf oder persönlich zeigen.',
    ru: 'Если тебе удобно, могу показать комнату в будни после 17:00 по видеосвязи или лично.',
    hi: 'यदि आप उपलब्ध हैं, तो मैं कार्यदिवसों में 17:00 के बाद वीडियो कॉल या व्यक्तिगत रूप से कमरा दिखा सकती हूं।',
  },
  'eğer uygunsan hafta içi 17:00 sonrasında video görüşmeyle veya yüz yüze odayı gösterebilirim.': {
    it: "Se sei disponibile, posso mostrarti la stanza nei giorni feriali dopo le 17:00 tramite videochiamata o di persona.",
    tr: 'Eğer uygunsan hafta içi 17:00 sonrasında video görüşmeyle veya yüz yüze odayı gösterebilirim.',
    en: 'If you are free, I can show you the room on weekdays after 17:00 via video call or in person.',
    de: 'Wenn du Zeit hast, kann ich dir das Zimmer wochentags nach 17:00 Uhr per Videoanruf oder persönlich zeigen.',
    ru: 'Если тебе удобно, могу показать комнату в будни после 17:00 по видеосвязи или лично.',
    hi: 'यदि आप उपलब्ध हैं, तो मैं कार्यदिवसों में 17:00 के बाद वीडियो कॉल या व्यक्तिगत रूप से कमरा दिखा सकती हूं।',
  },

  // Giulia - Subentro & Agenzia delle Entrate
  "ciao cenk! abbiamo anche preparato il contratto di subentro registrato all'agenzia delle entrate, così sei subito in regola per il permesso di soggiorno.": {
    it: "Ciao Cenk! Abbiamo anche preparato il contratto di subentro registrato all'Agenzia delle Entrate, così sei subito in regola per il permesso di soggiorno.",
    tr: "Selam Cenk! Gelir İdaresi'ne (Agenzia delle Entrate) kayıtlı resmi devir (subentro) sözleşmesini de hazırladık, böylece oturum iznin (permesso) için hemen yasal güvencede olacaksın.",
    en: "Hi Cenk! We also prepared the official takeover (subentro) contract registered with the Revenue Agency, so you'll be fully compliant for your residence permit right away.",
    de: "Hallo Cenk! Wir haben auch den beim Finanzamt registrierten Subentro-Übernahmevertrag vorbereitet, sodass du sofort für deine Aufenthaltsgenehmigung abgesichert bist.",
    ru: 'Привет Дженк! Мы также подготовили официальный договор переуступки (subentro), зарегистрированный в налоговой, так что у тебя сразу будет всё в порядке для ВНЖ.',
    hi: 'नमस्ते Cenk! हमने राजस्व एजेंसी में पंजीकृत आधिकारिक सबेंट्रो अनुबंध भी तैयार किया है, ताकि आपका निवास परमिट तुरंत वैध रहे।',
  },

  // Lucas - Portello Engineering room
  "hi! the room is 2 minutes walk from portello engineering dept. everything is included in the rent, let me know if you want a video call.": {
    en: 'Hi! The room is 2 minutes walk from Portello engineering dept. Everything is included in the rent, let me know if you want a video call.',
    it: "Ciao! La stanza dista 2 minuti a piedi dal polo d'ingegneria del Portello. Tutto è compreso nel canone, fammi sapere se vuoi una videochiamata.",
    tr: 'Selam! Oda Portello mühendislik bölümüne 2 dakika yürüme mesafesinde. Her şey kiraya dahil, görüntülü görüşmek istersen haber ver.',
    de: 'Hallo! Das Zimmer ist 2 Gehminuten vom Ingenieurbereich Portello entfernt. Alles ist in der Miete enthalten, sag Bescheid, wenn du einen Videoanruf möchtest.',
    ru: 'Привет! Комната в 2 минутах ходьбы от инженерного факультета в Портелло. Всё включено в стоимость, дай знать, если нужен видеозвонок.',
    hi: 'नमस्ते! कमरा पोर्टेलो इंजीनियरिंग विभाग से 2 मिनट की पैदल दूरी पर है। सब कुछ किराए में शामिल है, वीडियो कॉल के लिए बताएं।',
  },
  'selam! oda portello mühendislik bölümüne 2 dakika yürüme mesafesinde. her şey kiraya dahil, görüntülü görüşmek istersen haber ver.': {
    en: 'Hi! The room is 2 minutes walk from Portello engineering dept. Everything is included in the rent, let me know if you want a video call.',
    it: "Ciao! La stanza dista 2 minuti a piedi dal polo d'ingegneria del Portello. Tutto è compreso nel canone, fammi sapere se vuoi una videochiamata.",
    tr: 'Selam! Oda Portello mühendislik bölümüne 2 dakika yürüme mesafesinde. Her şey kiraya dahil, görüntülü görüşmek istersen haber ver.',
    de: 'Hallo! Das Zimmer ist 2 Gehminuten vom Ingenieurbereich Portello entfernt. Alles ist in der Miete enthalten, sag Bescheid, wenn du einen Videoanruf möchtest.',
    ru: 'Привет! Комната в 2 минутах ходьбы от инженерного факультета в Портелло. Всё включено в стоимость, дай знать, если нужен видеозвонок.',
    hi: 'नमस्ते! कमरा पोर्टेलो इंजीनियरिंग विभाग से 2 मिनट की पैदल दूरी पर है। सब कुछ किराए में शामिल है, वीडियो कॉल के लिए बताएं।',
  },

  // Sara - Quiet flat & Codice Fiscale
  "ciao! l'appartamento è molto silenzioso, perfetto per studiare. se hai bisogno del codice fiscale o della registrazione del contratto, ti aiutiamo noi.": {
    it: "Ciao! L'appartamento è molto silenzioso, perfetto per studiare. Se hai bisogno del codice fiscale o della registrazione del contratto, ti aiutiamo noi.",
    tr: "Selam! Dairemiz son derece sessiz, ders çalışmak için mükemmel. Codice fiscale (vergi numarası) veya sözleşme kaydında yardıma ihtiyacın olursa sana yardımcı oluruz.",
    en: "Hi! The apartment is very quiet, perfect for studying. If you need help with the codice fiscale or contract registration, we will assist you.",
    de: 'Hallo! Die Wohnung ist sehr ruhig, perfekt zum Lernen. Wenn du Hilfe bei der Steuernummer (Codice Fiscale) oder der Vertragsregistrierung brauchst, helfen wir dir gern.',
    ru: 'Привет! Квартира очень тихая, идеальна для учебы. Если понадобится помощь с codice fiscale или регистрацией договора, мы поможем.',
    hi: 'नमस्ते! अपार्टमेंट बहुत शांत है, पढ़ाई के लिए बिल्कुल सही। यदि आपको कोडिस फिस्केल या अनुबंध पंजीकरण में मदद चाहिए, तो हम आपकी सहायता करेंगे।',
  },

  // Marco - Prato della Valle
  "prato della valle è a due passi dal tram, zona perfetta per uscire la sera e per raggiungere qualsiasi facoltà in bicicletta.": {
    it: 'Prato della Valle è a due passi dal tram, zona perfetta per uscire la sera e per raggiungere qualsiasi facoltà in bicicletta.',
    tr: 'Prato della Valle tramvaya iki adım mesafede; akşam dışarı çıkmak ve herhangi bir fakülteye bisikletle ulaşmak için kusursuz bir konum.',
    en: 'Prato della Valle is just steps away from the tram; a perfect area for evening life and reaching any campus easily by bike.',
    de: 'Prato della Valle ist nur wenige Schritte von der Straßenbahn entfernt, perfekt für den Feierabend und mit dem Rad zu jeder Fakultät.',
    ru: 'Прато-делла-Валле буквально в двух шагах от трамвая — идеальный район для вечерних прогулок и поездок на велосипеде на любой факультет.',
    hi: 'प्रातो देल्ला वैले ट्रैम से कुछ ही कदम दूर है; शाम को घूमने और साइकिल से किसी भी संकाय तक पहुंचने के लिए आदर्श क्षेत्र।',
  },

  // Common user inquiries
  'odayı ne zaman görebilirim? video tur imkanı var mı?': {
    tr: 'Odayı ne zaman görebilirim? Video tur imkanı var mı?',
    it: 'Quando posso vedere la stanza? È possibile fare un video tour?',
    en: 'When can I see the room? Is a video tour available?',
    de: 'Wann kann ich das Zimmer besichtigen? Gibt es die Möglichkeit einer Videotour?',
    ru: 'Когда можно посмотреть комнату? Есть ли возможность видеотура?',
    hi: 'मैं कमरा कब देख सकता हूं? क्या वीडियो टूर संभव है?',
  },
  'quando posso vedere la stanza? è possibile fare un video tour?': {
    tr: 'Odayı ne zaman görebilirim? Video tur imkanı var mı?',
    it: 'Quando posso vedere la stanza? È possibile fare un video tour?',
    en: 'When can I see the room? Is a video tour available?',
    de: 'Wann kann ich das Zimmer besichtigen? Gibt es die Möglichkeit einer Videotour?',
    ru: 'Когда можно посмотреть комнату? Есть ли возможность видеотура?',
    hi: 'मैं कमरा कब देख सकता हूं? क्या वीडियो टूर संभव है?',
  },

  'sözleşme canone concordato mu, bursumu etkiler mi?': {
    tr: 'Sözleşme Canone Concordato mu, bursumu etkiler mi?',
    it: 'Il contratto è a Canone Concordato? Ha effetti sulla mia borsa di studio ESU?',
    en: 'Is the contract Canone Concordato? Does it affect my ESU scholarship?',
    de: 'Ist der Vertrag ein Canone Concordato? Beeinflusst er mein ESU-Stipendium?',
    ru: 'Договор по схеме Canone Concordato? Повлияет ли это на мою стипендию ESU?',
    hi: 'क्या अनुबंध कैनोने कॉनकॉर्डेटो है? क्या यह मेरी छात्रवृत्ति को प्रभावित करेगा?',
  },

  'aylık kira haricinde fatura ve aidat ne kadar?': {
    tr: 'Aylık kira haricinde fatura ve aidat ne kadar?',
    it: 'A quanto ammontano le spese e le bollette oltre al canone mensile?',
    en: 'How much are the utilities and condominium fees besides the monthly rent?',
    de: 'Wie hoch sind die Nebenkosten und Rechnungen neben der Monatsmiete?',
    ru: 'Сколько составляют коммунальные платежи и сборы помимо аренды?',
    hi: 'मासिक किराए के अलावा बिल और रखरखाव शुल्क कितना है?',
  },

  'odayı tutmak istiyorum, depozito şartları nedir?': {
    tr: 'Odayı tutmak istiyorum, depozito şartları nedir?',
    it: 'Vorrei bloccare la stanza, quali sono le condizioni per la caparra o deposito?',
    en: 'I would like to take the room, what are the deposit conditions?',
    de: 'Ich möchte das Zimmer mieten, wie lauten die Kautionsbedingungen?',
    ru: 'Я хочу забронировать комнату, какие условия по залогу?',
    hi: 'मैं कमरा बुक करना चाहता हूं, जमा की शर्तें क्या हैं?',
  },

  'dersler başlamadan önce giriş yapabilir miyim?': {
    tr: 'Dersler başlamadan önce giriş yapabilir miyim?',
    it: "Posso fare il check-in prima dell'inizio delle lezioni?",
    en: 'Can I move in before classes begin?',
    de: 'Kann ich vor Beginn der Vorlesungen einziehen?',
    ru: 'Могу ли я заселиться до начала занятий?',
    hi: 'क्या मैं कक्षाएं शुरू होने से पहले शिफ्ट हो सकता हूं?',
  },

  'teşekkürler, video görüşme için hazırım.': {
    tr: 'Teşekkürler, video görüşme için hazırım.',
    it: 'Grazie, sono pronto per la videochiamata.',
    en: 'Thank you, I am ready for the video call.',
    de: 'Danke, ich bin bereit für den Videoanruf.',
    ru: 'Спасибо, я готов к видеозвонку.',
    hi: 'धन्यवाद, मैं वीडियो कॉल के लिए तैयार हूं।',
  },
};

/**
 * Intelligent client-side language detector using score-based heuristics
 */
export function detectLanguage(text: string): Language {
  if (!text) return 'en';
  const clean = text.toLowerCase().trim();

  // 1. Cyrillic alphabet -> Russian
  if (/[\u0400-\u04FF]/.test(clean)) return 'ru';

  // 2. Devanagari script -> Hindi
  if (/[\u0900-\u097F]/.test(clean)) return 'hi';

  const scores: Record<'tr' | 'it' | 'en' | 'de', number> = {
    tr: 0,
    it: 0,
    en: 0,
    de: 0,
  };

  // Distinctive Turkish character weights
  if (/[çğışÇĞİŞ]/.test(text)) scores.tr += 8;
  if (/[öüÖÜ]/.test(text)) scores.tr += 3;

  // Distinctive Italian accented characters
  if (/[àèéìòù]/.test(clean)) scores.it += 6;

  // Distinctive German characters
  if (/[äßÄ]/.test(text)) scores.de += 8;

  // Keyword lexicons with word boundaries
  const trKeywords = [
    'selam', 'merhaba', 'odamız', 'odamiz', 'oda', 'odası', 'ev', 'kira',
    'kiraya', 'fatura', 'faturalar', 'sözleşme', 'sozlesme', 'burs', 'uygun',
    'öğrenci', 'ogrenci', 'tıp', 'mühendislik', 'görüşme', 'gorusme', 'bilgi',
    'teşekkür', 'fiyat', 'dahil', 'haberleşelim', 'kişilik', 'erkek', 'kız',
    'için', 'icin', 'hafta', 'dönem', 'donem', 'balkonlu', 'tutmak', 'depozito'
  ];

  const itKeywords = [
    'ciao', 'buongiorno', 'buonasera', 'grazie', 'prego', 'stanza', 'camera',
    'appartamento', 'affitto', 'contratto', 'subentro', 'spese', 'bollette',
    'quando', 'posso', 'vedere', 'silenzioso', 'libera', 'disponibile',
    'siamo', 'ragazzi', 'delle', 'della', 'degli', 'con', 'per', 'anche',
    'fiscale', 'subito', 'nostra', 'nostro', 'abbiamo', 'preparato', 'regola',
    'entrate', 'soggiorno', 'lezioni', 'feriali', 'mostrarti', 'videochiamata'
  ];

  const enKeywords = [
    'hi', 'hello', 'thanks', 'thank', 'room', 'apartment', 'flat', 'rent',
    'bills', 'contract', 'available', 'walk', 'dept', 'minutes', 'call',
    'video', 'free', 'student', 'university', 'when', 'can', 'see',
    'engineering', 'included', 'know', 'classes', 'deposit', 'move'
  ];

  const deKeywords = [
    'hallo', 'danke', 'bitte', 'zimmer', 'wohnung', 'miete', 'frei', 'student',
    'universität', 'wann', 'kann', 'ich', 'sehen', 'guten', 'tag', 'nebenkosten',
    'vertrag', 'semesterbeginn'
  ];

  for (const w of trKeywords) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(clean)) scores.tr += 3;
  }
  for (const w of itKeywords) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(clean)) scores.it += 3;
  }
  for (const w of enKeywords) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(clean)) scores.en += 3;
  }
  for (const w of deKeywords) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(clean)) scores.de += 3;
  }

  let maxScore = 0;
  let detected: Language = 'en';

  (Object.keys(scores) as Array<'tr' | 'it' | 'en' | 'de'>).forEach((lang) => {
    if (scores[lang] > maxScore) {
      maxScore = scores[lang];
      detected = lang;
    }
  });

  // If no clear winner, inspect specific Italian contractions common in student texts
  if (maxScore === 0) {
    if (clean.includes("l'") || clean.includes("d'") || clean.includes("all'")) {
      return 'it';
    }
    if (clean.startsWith('selam') || clean.startsWith('merhaba')) {
      return 'tr';
    }
    if (clean.startsWith('ciao')) {
      return 'it';
    }
  }

  return detected;
}

function normalizeTextForLookup(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, '')
    .replace(/\s+/g, ' ');
}

function decodeHtmlEntities(str: string): string {
  if (typeof document === 'undefined') return str;
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

const CACHE_PREFIX = 'padova_trans_v2_';

function getCachedTranslation(text: string, targetLang: Language): string | null {
  try {
    const key = `${CACHE_PREFIX}${targetLang}_${encodeURIComponent(text.slice(0, 100))}`;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setCachedTranslation(text: string, targetLang: Language, translation: string): void {
  try {
    const key = `${CACHE_PREFIX}${targetLang}_${encodeURIComponent(text.slice(0, 100))}`;
    localStorage.setItem(key, translation);
  } catch {
    // Storage might be full or private browsing quota
  }
}

/**
 * Robust multilingual student housing translation engine
 */
export async function translateText(
  text: string,
  targetLang: Language,
  forcedSourceLang?: Language
): Promise<{ translatedText: string; detectedSourceLang: Language }> {
  const trimmed = text.trim();
  const detected = forcedSourceLang || detectLanguage(trimmed);
  const normalizedInput = normalizeTextForLookup(trimmed);

  // 1. Check preset dictionary (exact or normalized match)
  for (const [key, map] of Object.entries(PRESET_TRANSLATIONS)) {
    const normKey = normalizeTextForLookup(key);
    const matchesKey = normKey === normalizedInput;
    const matchesValues = Object.values(map).some(
      v => v && normalizeTextForLookup(v) === normalizedInput
    );

    if (matchesKey || matchesValues) {
      if (map[targetLang]) {
        return {
          translatedText: map[targetLang]!,
          detectedSourceLang: detected,
        };
      }
    }
  }

  // If already in target language and no preset override was requested, return as-is
  if (detected === targetLang) {
    return { translatedText: trimmed, detectedSourceLang: detected };
  }

  // 2. Check cached translations in localStorage
  const cached = getCachedTranslation(trimmed, targetLang);
  if (cached) {
    return { translatedText: cached, detectedSourceLang: detected };
  }

  // 3. Live translation via Gemini (Firebase AI Logic)
  try {
    const geminiTranslation = await translateWithGemini(trimmed, detected, targetLang);
    if (geminiTranslation && geminiTranslation.trim().length > 0) {
      const cleanResult = geminiTranslation.trim();
      if (cleanResult.toLowerCase() !== trimmed.toLowerCase()) {
        setCachedTranslation(trimmed, targetLang, cleanResult);
        return { translatedText: cleanResult, detectedSourceLang: detected };
      }
    }
  } catch (err) {
    console.warn('Gemini translation notice:', err);
  }

  // 4. Secondary fallback: Smart Padova housing vocabulary replacement
  const fallbackTranslated = contextualHousingTranslate(trimmed, detected, targetLang);
  if (fallbackTranslated && fallbackTranslated !== trimmed) {
    setCachedTranslation(trimmed, targetLang, fallbackTranslated);
    return { translatedText: fallbackTranslated, detectedSourceLang: detected };
  }

  // 5. Final fallback
  return {
    translatedText: trimmed,
    detectedSourceLang: detected,
  };
}

/**
 * Contextual Padova student vocabulary translator for offline or rate-limited environments
 */
function contextualHousingTranslate(text: string, from: Language, to: Language): string {
  // Common student housing phrase glossary
  const phraseMap: Array<Record<Language, string>> = [
    {
      it: 'posso vedere la stanza',
      tr: 'odayı görebilir miyim',
      en: 'can I see the room',
      de: 'kann ich das Zimmer sehen',
      ru: 'могу посмотреть комнату',
      hi: 'क्या मैं कमरा देख सकता हूँ',
    },
    {
      it: 'quanto costa',
      tr: 'ne kadar',
      en: 'how much is it',
      de: 'wie viel kostet es',
      ru: 'сколько стоит',
      hi: 'यह कितने का है',
    },
    {
      it: 'quando è libera',
      tr: 'ne zaman müsait',
      en: 'when is it available',
      de: 'wann ist es frei',
      ru: 'когда освобождается',
      hi: 'यह कब उपलब्ध है',
    },
    {
      it: 'le spese sono incluse',
      tr: 'faturalar fiyata dahil',
      en: 'bills are included',
      de: 'Nebenkosten sind inbegriffen',
      ru: 'коммуналка включена',
      hi: 'बिल शामिल हैं',
    },
    {
      it: 'videochiamata',
      tr: 'görüntülü arama',
      en: 'video call',
      de: 'Videoanruf',
      ru: 'видеосвязь',
      hi: 'वीडियो कॉल',
    },
    {
      it: 'permesso di soggiorno',
      tr: 'oturum izni',
      en: 'residence permit',
      de: 'Aufenthaltserlaubnis',
      ru: 'вид на жительство',
      hi: 'निवास अनुमति',
    },
  ];

  let result = text;
  let translatedAny = false;

  for (const item of phraseMap) {
    const fromPhrase = item[from];
    const toPhrase = item[to];
    if (fromPhrase && toPhrase) {
      const regex = new RegExp(fromPhrase, 'gi');
      if (regex.test(result)) {
        result = result.replace(regex, toPhrase);
        translatedAny = true;
      }
    }
  }

  return translatedAny ? result : text;
}
