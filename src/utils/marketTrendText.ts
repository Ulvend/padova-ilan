import { Language } from '../types';

// Bölge özetleri; anahtar: mockData.DISTRICT_BENCHMARKS anahtarı. Sıra: [tr, en, it, de, ru, hi].
const TRENDS: Record<string, readonly [string, string, string, string, string, string]> = {
  'Policlinico / Tıp Fakültesi (< 500m)': [
    'Tıp fakültesi ve hastane yakınlığı sebebiyle talep çok yüksek',
    'Very high demand thanks to the proximity of the medical school and hospital',
    'Domanda molto alta grazie alla vicinanza a Medicina e all\'ospedale',
    'Sehr hohe Nachfrage wegen der Nähe zur Medizinischen Fakultät und zum Klinikum',
    'Очень высокий спрос из-за близости медфакультета и больницы',
    'मेडिकल स्कूल और अस्पताल के पास होने से माँग बहुत अधिक है',
  ],
  'Portello / Mühendislik & Fen (< 500m)': [
    'Mühendislik binaları ve kütüphanelere yürüme mesafesinde',
    'Within walking distance of the engineering buildings and libraries',
    'A pochi passi dagli edifici di Ingegneria e dalle biblioteche',
    'Zu Fuß zu den Ingenieurgebäuden und Bibliotheken erreichbar',
    'В пешей доступности от инженерных корпусов и библиотек',
    'इंजीनियरिंग भवनों और पुस्तकालयों से पैदल दूरी पर',
  ],
  'Beato Pellegrino / Beşeri Bilimler': [
    'Edebiyat ve felsefe kompleksine yakın sakin yerleşim',
    'Quiet residential area close to the humanities and philosophy complex',
    'Zona residenziale tranquilla vicino al polo umanistico e filosofico',
    'Ruhiges Wohnviertel nahe dem geisteswissenschaftlichen Komplex',
    'Тихий жилой район рядом с гуманитарным комплексом',
    'मानविकी और दर्शन परिसर के पास शांत आवासीय क्षेत्र',
  ],
  'Centro Storico / Prato della Valle': [
    'Tarihi merkez, sosyal hayat ve tramvay hattı üzerinde',
    'Historic centre with lively social life, on the tram line',
    'Centro storico, vita sociale vivace e sulla linea del tram',
    'Historisches Zentrum mit regem Sozialleben, an der Straßenbahnlinie',
    'Исторический центр с активной жизнью, на трамвайной линии',
    'ऐतिहासिक केंद्र, सामाजिक जीवन और ट्राम लाइन पर',
  ],
  Forcellini: [
    'Hastanelere yakın, yeşil alanlı ve bisiklet dostu bölge',
    'Close to the hospitals, green and bike-friendly',
    'Vicino agli ospedali, verde e adatto alla bicicletta',
    'Nahe den Kliniken, grün und fahrradfreundlich',
    'Рядом с больницами, зелёный и удобный для велосипедистов',
    'अस्पतालों के पास, हरा-भरा और साइकिल के अनुकूल क्षेत्र',
  ],
  Arcella: [
    'Tren istasyonuna yakın, tramvay ile merkeze 8 dk',
    'Close to the train station, 8 minutes to the centre by tram',
    'Vicino alla stazione, 8 minuti dal centro in tram',
    'Nahe dem Bahnhof, 8 Minuten mit der Tram ins Zentrum',
    'Рядом с вокзалом, до центра 8 минут на трамвае',
    'रेलवे स्टेशन के पास, ट्राम से केंद्र 8 मिनट',
  ],
  Guizza: [
    'Tramvay güney son durağı, sakin ve ekonomik',
    'Southern tram terminus, quiet and affordable',
    'Capolinea sud del tram, zona tranquilla ed economica',
    'Südliche Tram-Endhaltestelle, ruhig und günstig',
    'Южная конечная трамвая, тихо и недорого',
    'ट्राम का दक्षिणी अंतिम स्टॉप, शांत और किफायती',
  ],
};

const LANG_INDEX: Record<Language, number> = { tr: 0, en: 1, it: 2, de: 3, ru: 4, hi: 5 };

/** Bölge özetini kullanıcının dilinde döner; bilinmeyen bölge için özgün metni verir. */
export const marketTrendLabel = (districtKey: string, original: string, lang: Language): string =>
  TRENDS[districtKey]?.[LANG_INDEX[lang]] ?? original;
