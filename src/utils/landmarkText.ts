import { Language } from '../types';

// UniPD kampüs/ulaşım noktalarının dile göre adları. Anahtar: mockData.UNIPD_LANDMARKS[].name (özgün metin).
// Sıra: [tr, en, it, de, ru, hi] için [ad, tür].
type Pair = readonly [string, string];
type Row = readonly [Pair, Pair, Pair, Pair, Pair, Pair];

const LANG_INDEX: Record<Language, number> = { tr: 0, en: 1, it: 2, de: 3, ru: 4, hi: 5 };

const LANDMARKS: Record<string, Row> = {
  'Palazzo Bo (UniPD Rektörlük & Hukuk)': [
    ['Palazzo Bo', 'Rektörlük & Hukuk'],
    ['Palazzo Bo', 'Rectorate & Law'],
    ['Palazzo Bo', 'Rettorato e Giurisprudenza'],
    ['Palazzo Bo', 'Rektorat & Rechtswissenschaft'],
    ['Палаццо Бо', 'Ректорат и юриспруденция'],
    ['पालाज़ो बो', 'रेक्टोरेट और कानून'],
  ],
  'Policlinico & Tıp Fakültesi (Scuola di Medicina)': [
    ['Policlinico & Tıp Fakültesi', 'Tıp & Cerrahi (MED)'],
    ['Policlinico & School of Medicine', 'Medicine & Surgery (MED)'],
    ['Policlinico & Scuola di Medicina', 'Medicina e Chirurgia (MED)'],
    ['Policlinico & Medizinische Fakultät', 'Medizin & Chirurgie (MED)'],
    ['Поликлиника и медицинский факультет', 'Медицина и хирургия (MED)'],
    ['पॉलीक्लिनिको और चिकित्सा संकाय', 'चिकित्सा और शल्य चिकित्सा (MED)'],
  ],
  'Portello Mühendislik & Fen Kampüsü (DII)': [
    ['Portello Mühendislik & Fen Kampüsü', 'Mühendislik & Fen'],
    ['Portello Engineering & Science Campus', 'Engineering & Science'],
    ['Campus Portello Ingegneria e Scienze', 'Ingegneria e Scienze'],
    ['Campus Portello Ingenieur- & Naturwissenschaften', 'Ingenieur- & Naturwissenschaften'],
    ['Кампус Портелло (инженерия и науки)', 'Инженерия и науки'],
    ['पोर्टेलो इंजीनियरिंग और विज्ञान परिसर', 'इंजीनियरिंग और विज्ञान'],
  ],
  'Complesso Beato Pellegrino (Beşeri Bilimler)': [
    ['Beato Pellegrino Beşeri Bilimler', 'Edebiyat & Felsefe'],
    ['Beato Pellegrino Humanities', 'Literature & Philosophy'],
    ['Complesso Beato Pellegrino', 'Lettere e Filosofia'],
    ['Beato Pellegrino Geisteswissenschaften', 'Literatur & Philosophie'],
    ['Беато Пеллегрино (гуманитарные науки)', 'Литература и философия'],
    ['बेआतो पेलेग्रिनो मानविकी', 'साहित्य और दर्शन'],
  ],
  'Stazione Ferroviaria Padova (Tren Garı)': [
    ['Padova Tren Garı', 'Ulaşım Merkezi & Tramvay'],
    ['Padova Railway Station', 'Transport Hub & Tram'],
    ['Stazione Ferroviaria di Padova', 'Nodo di Trasporto e Tram'],
    ['Bahnhof Padua', 'Verkehrsknoten & Tram'],
    ['Ж/д вокзал Падуи', 'Транспортный узел и трамвай'],
    ['पदुवा रेलवे स्टेशन', 'परिवहन केंद्र और ट्राम'],
  ],
  'Prato della Valle': [
    ['Prato della Valle', 'Sosyal Meydan & Tramvay'],
    ['Prato della Valle', 'Social Square & Tram'],
    ['Prato della Valle', 'Piazza e Tram'],
    ['Prato della Valle', 'Stadtplatz & Tram'],
    ['Прато делла Валле', 'Городская площадь и трамвай'],
    ['प्रातो देल्ला वाल्ले', 'सामाजिक चौक और ट्राम'],
  ],
};

/** Özgün nokta adından kullanıcının diline göre {name, type} döner; bilinmiyorsa özgün adı verir. */
export const landmarkLabel = (originalName: string, originalType: string, lang: Language) => {
  const row = LANDMARKS[originalName];
  if (!row) return { name: originalName.split('(')[0].trim(), type: originalType };
  const [name, type] = row[LANG_INDEX[lang]];
  return { name, type };
};
