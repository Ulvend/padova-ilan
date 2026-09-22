import { HousingListing, Language, ContractType, DistrictArea, RoomType } from '../types';

export const CONTRACT_TYPE_TRANSLATIONS: Record<Language, Record<string, string>> = {
  tr: {
    'Contratto per Studenti (Canone Concordato)': 'Öğrenci Sözleşmesi (Canone Concordato - Rayiç Kira)',
    'Subentro (Resmi Sözleşme Devri)': 'Sözleşme Devri (Subentro)',
    'Contratto Transitorio (1-18 Ay)': 'Geçici Öğrenci Sözleşmesi (1-18 Ay)',
    'Standart 4+4 / 3+2 Yıllık': 'Standart 4+4 / 3+2 Yıllık Sözleşme',
  },
  en: {
    'Contratto per Studenti (Canone Concordato)': 'Student Contract (Agreed Regulated Rent - Canone Concordato)',
    'Subentro (Resmi Sözleşme Devri)': 'Sublease / Subentro (Official Contract Transfer)',
    'Contratto Transitorio (1-18 Ay)': 'Transitory Student Contract (1-18 Months)',
    'Standart 4+4 / 3+2 Yıllık': 'Standard 4+4 / 3+2 Year Contract',
  },
  it: {
    'Contratto per Studenti (Canone Concordato)': 'Contratto per Studenti (Canone Concordato)',
    'Subentro (Resmi Sözleşme Devri)': 'Subentro (Cessione Ufficiale di Contratto)',
    'Contratto Transitorio (1-18 Ay)': 'Contratto Transitorio (1-18 Mesi)',
    'Standart 4+4 / 3+2 Yıllık': 'Contratto Standard 4+4 / 3+2 Anni',
  },
  de: {
    'Contratto per Studenti (Canone Concordato)': 'Studentenmietvertrag (Mietpreisgebundene Miete - Canone Concordato)',
    'Subentro (Resmi Sözleşme Devri)': 'Vertragsübernahme (Subentro)',
    'Contratto Transitorio (1-18 Ay)': 'Befristeter Studentenvertrag (1-18 Monate)',
    'Standart 4+4 / 3+2 Yıllık': 'Standardmietvertrag 4+4 / 3+2 Jahre',
  },
  ru: {
    'Contratto per Studenti (Canone Concordato)': 'Студенческий договор (Согласованная аренда Canone Concordato)',
    'Subentro (Resmi Sözleşme Devri)': 'Переуступка аренды (Субэнтро)',
    'Contratto Transitorio (1-18 Ay)': 'Временный договор для студентов (1-18 месяцев)',
    'Standart 4+4 / 3+2 Yıllık': 'Стандартный договор 4+4 / 3+2 года',
  },
  hi: {
    'Contratto per Studenti (Canone Concordato)': 'छात्र अनुबंध (विनियमित सहमति किराया - Canone Concordato)',
    'Subentro (Resmi Sözleşme Devri)': 'अनुबंध हस्तांतरण (Subentro)',
    'Contratto Transitorio (1-18 Ay)': 'अस्थायी छात्र अनुबंध (1-18 महीने)',
    'Standart 4+4 / 3+2 Yıllık': 'मानक 4+4 / 3+2 वर्ष अनुबंध',
  },
};

export const DISTRICT_TRANSLATIONS: Record<Language, Record<string, string>> = {
  tr: {
    'Policlinico / Tıp Fakültesi (< 500m)': 'Policlinico / Tıp Fakültesi (< 500m)',
    'Portello / Mühendislik & Fen (< 500m)': 'Portello / Mühendislik & Fen (< 500m)',
    'Beato Pellegrino / Beşeri Bilimler': 'Beato Pellegrino / Beşeri Bilimler & Edebiyat',
    'Centro Storico / Prato della Valle': 'Tarihi Merkez / Prato della Valle',
    'Forcellini': 'Forcellini Bölgesi',
    'Arcella': 'Arcella / İstasyon Çevresi',
    'Guizza': 'Guizza / Tramvay Hattı',
    'Tümü': 'Tüm Padova Bölgeleri',
  },
  en: {
    'Policlinico / Tıp Fakültesi (< 500m)': 'Policlinico / Medical Faculty (< 500m)',
    'Portello / Mühendislik & Fen (< 500m)': 'Portello / Engineering & Sciences (< 500m)',
    'Beato Pellegrino / Beşeri Bilimler': 'Beato Pellegrino / Humanities Complex',
    'Centro Storico / Prato della Valle': 'Historical Center / Prato della Valle',
    'Forcellini': 'Forcellini District',
    'Arcella': 'Arcella / Station Area',
    'Guizza': 'Guizza / Tramway Line',
    'Tümü': 'All Padova Areas',
  },
  it: {
    'Policlinico / Tıp Fakültesi (< 500m)': 'Policlinico / Facoltà di Medicina (< 500m)',
    'Portello / Mühendislik & Fen (< 500m)': 'Portello / Ingegneria e Scienze (< 500m)',
    'Beato Pellegrino / Beşeri Bilimler': 'Beato Pellegrino / Polo Umanistico',
    'Centro Storico / Prato della Valle': 'Centro Storico / Prato della Valle',
    'Forcellini': 'Zona Forcellini',
    'Arcella': 'Arcella / Stazione Ferroviaria',
    'Guizza': 'Guizza / Linea Tram',
    'Tümü': 'Tutte le zone di Padova',
  },
  de: {
    'Policlinico / Tıp Fakültesi (< 500m)': 'Poliklinik / Medizinische Fakultät (< 500m)',
    'Portello / Mühendislik & Fen (< 500m)': 'Portello / Ingenieur- & Naturwissenschaften (< 500m)',
    'Beato Pellegrino / Beşeri Bilimler': 'Beato Pellegrino / Geisteswissenschaften',
    'Centro Storico / Prato della Valle': 'Historisches Zentrum / Prato della Valle',
    'Forcellini': 'Bezirk Forcellini',
    'Arcella': 'Arcella / Bahnhofsviertel',
    'Guizza': 'Guizza / Straßenbahnlinie',
    'Tümü': 'Alle Stadtteile von Padua',
  },
  ru: {
    'Policlinico / Tıp Fakültesi (< 500m)': 'Поликлиника / Медицинский факультет (< 500м)',
    'Portello / Mühendislik & Fen (< 500m)': 'Портелло / Инженерия и наука (< 500м)',
    'Beato Pellegrino / Beşeri Bilimler': 'Беато Пеллегрино / Гуманитарный кампус',
    'Centro Storico / Prato della Valle': 'Исторический центр / Прато делла Валле',
    'Forcellini': 'Район Форчеллини',
    'Arcella': 'Арчелла / Привокзальный район',
    'Guizza': 'Гуицца / Трамвайная ветка',
    'Tümü': 'Все районы Падуи',
  },
  hi: {
    'Policlinico / Tıp Fakültesi (< 500m)': 'पॉलीक्लिनिक / मेडिकल फैकल्टी (< 500मी)',
    'Portello / Mühendislik & Fen (< 500m)': 'पोर्टेलो / इंजीनियरिंग और विज्ञान (< 500मी)',
    'Beato Pellegrino / Beşeri Bilimler': 'बीतो पेलेग्रिनो / मानविकी संकाय',
    'Centro Storico / Prato della Valle': 'ऐतिहासिक केंद्र / प्रातो डेला वैले',
    'Forcellini': 'फोर्सेलिनी क्षेत्र',
    'Arcella': 'आर्सेला / स्टेशन क्षेत्र',
    'Guizza': 'गुइज़ा / ट्राम लाइन',
    'Tümü': 'पादुआ के सभी क्षेत्र',
  },
};

export const ROOM_TYPE_TRANSLATIONS: Record<Language, Record<RoomType, string>> = {
  tr: {
    Singola: 'Singola (Tek Kişilik Oda)',
    Doppia: 'Doppia (Çift Kişilik Oda)',
    'Posto Letto': 'Posto Letto (Paylaşımlı Oda Yatağı)',
    Monolocale: 'Monolocale (Stüdyo Daire)',
    Bilocale: 'Bilocale (2 Odalı Daire)',
  },
  en: {
    Singola: 'Single Room (Singola)',
    Doppia: 'Double Room (Doppia)',
    'Posto Letto': 'Shared Room Bed (Posto Letto)',
    Monolocale: 'Studio Apartment (Monolocale)',
    Bilocale: 'One-Bedroom Apartment (Bilocale)',
  },
  it: {
    Singola: 'Camera Singola',
    Doppia: 'Camera Doppia',
    'Posto Letto': 'Posto Letto in Doppia',
    Monolocale: 'Monolocale Indipendente',
    Bilocale: 'Bilocale Arredato',
  },
  de: {
    Singola: 'Einzelzimmer (Singola)',
    Doppia: 'Doppelzimmer (Doppia)',
    'Posto Letto': 'Bett im Mehrbettzimmer (Posto Letto)',
    Monolocale: 'Studio-Apartment (Monolocale)',
    Bilocale: 'Zwei-Zimmer-Wohnung (Bilocale)',
  },
  ru: {
    Singola: 'Одноместная комната (Singola)',
    Doppia: 'Двухместная комната (Doppia)',
    'Posto Letto': 'Место в комнате (Posto Letto)',
    Monolocale: 'Студия (Monolocale)',
    Bilocale: 'Двухкомнатная квартира (Bilocale)',
  },
  hi: {
    Singola: 'सिंगल कमरा (Singola)',
    Doppia: 'डबल कमरा (Doppia)',
    'Posto Letto': 'साझा बिस्तर (Posto Letto)',
    Monolocale: 'स्टूडियो अपार्टमेंट (Monolocale)',
    Bilocale: 'दो कमरों का अपार्टमेंट (Bilocale)',
  },
};

// Rich multilingual translations for Padova student listings
interface ListingLocalization {
  title: Record<Language, string>;
  description: Record<Language, string>;
  expenses: Record<Language, string>;
  fairPriceText: Record<Language, string>;
  videoTitle?: Record<Language, string>;
  distanceToFaculty?: Record<Language, string>;
  confirmationTimeLeft?: Record<Language, string>;
  compatibilityReason?: Record<Language, string>;
}

const LISTINGS_I18N: Record<string, ListingLocalization> = {
  'PD-FORC-101': {
    title: {
      tr: 'Via Forcellini - 3 Kişilik Kız Evinde Boşalan Balkonlu Singola Oda',
      en: 'Via Forcellini - Single Room with Balcony in 3-Person Female Flat',
      it: 'Via Forcellini - Stanza Singola con Balcone in Appartamento Femminile per 3',
      de: 'Via Forcellini - Einzelzimmer mit Balkon in 3er-Mädchen-WG',
      ru: 'Via Forcellini - Одноместная комната с балконом в квартире для 3 девушек',
      hi: 'Via Forcellini - 3 छात्राओं के फ्लैट में बालकनी वाला सिंगल कमरा',
    },
    description: {
      tr: "Policlinico'ya 5 dakika yürüme mesafesinde. Odamı dönem başlangıcında devrediyorum. Sözleşme resmi Contratto Transitorio per Studenti statüsündedir (Belediye Rayiç Kirası - Canone Concordato). Burs (ESU) ve İkametgah/Permesso için %100 resmidir. Geniş mutfak, çift banyo, hızlı fiber internet ve klima mevcuttur.",
      en: '5 minutes walking distance to the Policlinico Hospital. Handing over my room at the start of the semester. The agreement is an official Student Transitory Contract (Agreed Regulated Rent - Canone Concordato). 100% compliant for ESU scholarships and residence permit/permesso. Spacious kitchen, two bathrooms, fast fiber Wi-Fi, and air conditioning.',
      it: "A 5 minuti a piedi dal Policlinico. Cedo la mia stanza per inizio semestre. Il contratto è ufficiale Contratto Transitorio per Studenti a Canone Concordato, 100% valido per borsa di studio ESU e residenza/permesso. Ampia cucina, doppi servizi, internet fibra veloce e aria condizionata.",
      de: '5 Gehminuten von der Poliklinik entfernt. Übergebe mein Zimmer zu Semesterbeginn. Offizieller befristeter Studentenmietvertrag mit Mietpreisbindung (Canone Concordato), zu 100% gültig für ESU-Stipendium und Aufenthaltstitel. Große Küche, zwei Bäder, schnelles Glasfaser-WLAN und Klimaanlage.',
      ru: '5 минут пешком до клиники Policlinico. Переуступаю комнату к началу семестра. Официальный студенческий договор с регулируемой ставкой Canone Concordato. Полностью подходит для стипендии ESU и оформления ВНЖ. Просторная кухня, две ванные комнаты, скоростной оптоволоконный интернет и кондиционер.',
      hi: 'पॉलीक्लिनिक अस्पताल से 5 मिनट की पैदल दूरी। सेमेस्टर की शुरुआत में कमरा हस्तांतरित कर रही हूँ। यह अनुबंध विनियमित सहमति किराए (Canone Concordato) के तहत एक आधिकारिक छात्र अनुबंध है। ESU छात्रवृत्ति और निवास अनुमति के लिए 100% मान्य। बड़ी रसोई, दो बाथरूम, तेज फाइबर इंटरनेट और एसी उपलब्ध है।',
    },
    expenses: {
      tr: '+€40 Giderler',
      en: '+€40 Utilities',
      it: '+€40 Spese Condominiali',
      de: '+€40 Nebenkosten',
      ru: '+€40 Коммунальные',
      hi: '+€40 अन्य खर्च',
    },
    fairPriceText: {
      tr: 'Forcellini Ortalamasından %8 Daha Uygun (Canone Concordato)',
      en: '8% Below Forcellini Average (Canone Concordato Benchmark)',
      it: '8% Sotto la Media di Zona (Canone Concordato)',
      de: '8% unter dem Forcellini-Durchschnitt (Canone Concordato)',
      ru: 'На 8% выгоднее среднего по Форчеллини (Canone Concordato)',
      hi: 'फोर्सेलिनी औसत से 8% कम (Canone Concordato)',
    },
    videoTitle: {
      tr: '360° Oda & Ortak Alan / Balkon Turu',
      en: '360° Room & Common Areas / Balcony Tour',
      it: 'Tour 360° Stanza & Spazi Comuni / Balcone',
      de: '360° Rundgang Zimmer & Gemeinschaftsräume / Balkon',
      ru: '360° Тур по комнате и общим зонам / балкону',
      hi: '360° कमरा और साझा क्षेत्र / बालकनी टूर',
    },
    distanceToFaculty: {
      tr: 'Policlinico (< 400m)',
      en: 'Policlinico Hospital (< 400m)',
      it: 'Policlinico (< 400m)',
      de: 'Poliklinik (< 400m)',
      ru: 'Поликлиника (< 400м)',
      hi: 'पॉलीक्लिनिक (< 400मी)',
    },
    confirmationTimeLeft: {
      tr: '3 Gün Teyitli: 58s Kaldı',
      en: 'Reconfirmed: 58h Left',
      it: 'Verificato: Mancano 58 ore',
      de: 'Bestätigt: Noch 58 Std.',
      ru: 'Подтверждено: осталось 58ч',
      hi: 'सत्यापित: 58 घंटे शेष',
    },
    compatibilityReason: {
      tr: 'Tıp & Sessiz Çalışma Saatleri',
      en: 'Medicine & Quiet Study Hours',
      it: 'Medicina e Orari di Studio Silenziosi',
      de: 'Medizin & Ruhige Lernzeiten',
      ru: 'Медицина и тихие часы для учебы',
      hi: 'चिकित्सा और शांत अध्ययन घंटे',
    },
  },
  'PD-PORT-102': {
    title: {
      tr: 'Portello Kampüsü Karşısı - 2 Kişilik Erkek Dairesinde Boş Oda',
      en: 'Opposite Portello Campus - Private Room in 2-Person Male Apartment',
      it: 'Fronte Campus Portello - Stanza Privata in Appartamento Maschile per 2',
      de: 'Gegenüber Portello-Campus - Einzelzimmer in 2er-Männer-WG',
      ru: 'Напротив кампуса Портелло - комната в квартире для 2 парней',
      hi: 'पोर्टेलो परिसर के सामने - 2 छात्रों के अपार्टमेंट में निजी कमरा',
    },
    description: {
      tr: 'Portello Mühendislik kütüphanesine 2 dakikalık yürüme mesafesinde. Sessiz bir sokakta, yeni tadilattan geçmiş aydınlık oda. Sözleşme Subentro (Resmi Sözleşme Devri) şeklinde olup Canone Concordato rayiç sınırlarına uygundur.',
      en: '2 minutes walk from Portello Engineering Library. Newly renovated bright room on a quiet street. Contract is an official Sublease (Subentro Lease Transfer) registered under Canone Concordato guidelines.',
      it: 'A 2 minuti a piedi dalla biblioteca di Ingegneria del Portello. Stanza luminosa appena ristrutturata in via silenziosa. Contratto con Subentro ufficiale conforme alle tabelle del Canone Concordato.',
      de: '2 Gehminuten zur Portello-Ingenieurbibliothek. Helles, frisch renoviertes Zimmer in ruhiger Straße. Vertrag läuft über offizielle Vertragsübernahme (Subentro) im Rahmen der Canone Concordato-Richtlinien.',
      ru: 'В 2 минутах ходьбы от инженерной библиотеки Портелло. Светлая комната после ремонта на тихой улице. Договор переуступки (Subentro) в рамках согласованной ставки Canone Concordato.',
      hi: 'पोर्टेलो इंजीनियरिंग लाइब्रेरी से 2 मिनट की पैदल दूरी। शांत सड़क पर हाल ही में नवीनीकृत उज्ज्वल कमरा। Canone Concordato दिशानिर्देशों के तहत आधिकारिक अनुबंध हस्तांतरण (Subentro)।',
    },
    expenses: {
      tr: 'Faturalar Dahil',
      en: 'Bills Included',
      it: 'Spese Incluse',
      de: 'Nebenkosten inklusive',
      ru: 'Коммуналка включена',
      hi: 'बिल शामिल हैं',
    },
    fairPriceText: {
      tr: 'Portello Rayiç Ortalamasında (Canone Concordato)',
      en: 'Aligned with Portello Regulated Average (Canone Concordato)',
      it: 'In Linea con la Media Canone Concordato del Portello',
      de: 'Entspricht dem Portello-Durchschnitt (Canone Concordato)',
      ru: 'Соответствует средней ставке Canone Concordato в Портелло',
      hi: 'पोर्टेलो विनियमित औसत के अनुरूप (Canone Concordato)',
    },
    distanceToFaculty: {
      tr: 'Portello Mühendislik (< 200m)',
      en: 'Portello Engineering (< 200m)',
      it: 'Portello Ingegneria (< 200m)',
      de: 'Portello Ingenieurwesen (< 200m)',
      ru: 'Портелло Инженерия (< 200м)',
      hi: 'पोर्टेलो इंजीनियरिंग (< 200मी)',
    },
    confirmationTimeLeft: {
      tr: 'Teyitli: 42s Kaldı',
      en: 'Reconfirmed: 42h Left',
      it: 'Verificato: Mancano 42 ore',
      de: 'Bestätigt: Noch 42 Std.',
      ru: 'Подтверждено: осталось 42ч',
      hi: 'सत्यापित: 42 घंटे शेष',
    },
    compatibilityReason: {
      tr: 'Mühendislik & Proje Çalışmaları',
      en: 'Engineering & Collaborative Projects',
      it: 'Ingegneria e Studio Progetti',
      de: 'Ingenieurwesen & Projektarbeit',
      ru: 'Инженерия и совместные учебные проекты',
      hi: 'इंजीनियरिंग और सहयोगी परियोजनाएं',
    },
  },
  'PD-BEAT-103': {
    title: {
      tr: 'Beato Pellegrino Yanı - Geniş Masalı Ferah Tek Kişilik Oda',
      en: 'Next to Beato Pellegrino - Spacious Single Room with Large Desk',
      it: 'Accanto a Beato Pellegrino - Ampia Singola Luminosa con Grande Scrivania',
      de: 'Neben Beato Pellegrino - Geräumiges Einzelzimmer mit großem Schreibtisch',
      ru: 'Рядом с Беато Пеллегрино - просторная комната с большим столом',
      hi: 'बीतो पेलेग्रिनो के पास - बड़े अध्ययन डेस्क वाला विशाल सिंगल कमरा',
    },
    description: {
      tr: 'Beşeri Bilimler kampüsüne 150 metre mesafede. Yüksek tavanlı tarihi bina, sessiz çalışma ortamı. Sözleşme Contratto per Studenti (Belediye Rayiç Kirası - Canone Concordato) olup vergi indirimi sağlar.',
      en: '150 meters from the Humanities Campus. Historic building with high ceilings and quiet study atmosphere. Student Contract governed by Agreed Regulated Rent (Canone Concordato) with tax deduction benefits.',
      it: 'A 150 metri dal Polo Umanistico di Beato Pellegrino. Palazzo storico con soffitti alti e ambiente silenzioso. Contratto per Studenti a Canone Concordato con agevolazioni fiscali.',
      de: '150 Meter vom geisteswissenschaftlichen Campus entfernt. Historisches Gebäude mit hohen Decken und ruhiger Lernatmosphäre. Studentenmietvertrag mit Mietpreisbindung (Canone Concordato).',
      ru: 'В 150 метрах от гуманитарного комплекса. Историческое здание с высокими потолками и тихой атмосферой. Студенческий договор по схеме Canone Concordato с налоговыми льготами.',
      hi: 'मानविकी परिसर से 150 मीटर। ऊंची छत वाली ऐतिहासिक इमारत और शांत माहौल। कर छूट लाभ के साथ विनियमित छात्र अनुबंध (Canone Concordato)।',
    },
    expenses: {
      tr: '+€35 Giderler',
      en: '+€35 Utilities',
      it: '+€35 Spese',
      de: '+€35 Nebenkosten',
      ru: '+€35 Коммунальные',
      hi: '+€35 अन्य खर्च',
    },
    fairPriceText: {
      tr: 'Bölge Rayiciyle Tam Uyumlu (Canone Concordato)',
      en: 'Fully Compliant with Regulated Rent (Canone Concordato)',
      it: 'Pienamente Conforme al Canone Concordato',
      de: 'Vollständig mietpreisgebunden (Canone Concordato)',
      ru: 'Полностью соответствует нормам Canone Concordato',
      hi: 'विनियमित किराए के पूरी तरह अनुरूप (Canone Concordato)',
    },
    distanceToFaculty: {
      tr: 'Beato Pellegrino (< 150m)',
      en: 'Beato Pellegrino Campus (< 150m)',
      it: 'Beato Pellegrino (< 150m)',
      de: 'Beato Pellegrino Campus (< 150m)',
      ru: 'Беато Пеллегрино (< 150м)',
      hi: 'बीतो पेलेग्रिनो (< 150मी)',
    },
    confirmationTimeLeft: {
      tr: 'Teyitli: 71s Kaldı',
      en: 'Reconfirmed: 71h Left',
      it: 'Verificato: Mancano 71 ore',
      de: 'Bestätigt: Noch 71 Std.',
      ru: 'Подтверждено: осталось 71ч',
      hi: 'सत्यापित: 71 घंटे शेष',
    },
    compatibilityReason: {
      tr: 'Edebiyat, Kitap ve Yabancı Dil',
      en: 'Literature, Reading & Foreign Languages',
      it: 'Letteratura, Lettura e Lingue Straniere',
      de: 'Literatur, Lesen und Fremdsprachen',
      ru: 'Литература, чтение и иностранные языки',
      hi: 'साहित्य, अध्ययन और विदेशी भाषाएं',
    },
  },
  'PD-PRATO-104': {
    title: {
      tr: 'Prato della Valle / Centro - Müstakil Stüdyo Daire (Monolocale)',
      en: 'Prato della Valle / Center - Independent Studio Apartment (Monolocale)',
      it: 'Prato della Valle / Centro - Monolocale Indipendente Arredato',
      de: 'Prato della Valle / Zentrum - Unabhängiges Studio-Apartment (Monolocale)',
      ru: 'Прато делла Валле / Центр - Отдельная студия (Monolocale)',
      hi: 'प्रातो डेला वैले / केंद्र - स्वतंत्र स्टूडियो अपार्टमेंट (Monolocale)',
    },
    description: {
      tr: 'Prato della Valle meydanına 200m mesafede, özel mutfaklı ve klimalı bağımsız stüdyo daire. Padova Belediyesi Canone Concordato tablosuna kayıtlı resmi öğrenci sözleşmesiyle devredilmektedir.',
      en: '200 meters from Prato della Valle square, private independent studio with fitted kitchenette and AC. Transferred under official student lease registered in accordance with Padova Municipality Canone Concordato regulations.',
      it: 'A 200 metri da Prato della Valle, monolocale autonomo con angolo cottura e aria condizionata. Contratto ufficiale per studenti conforme alle tabelle del Canone Concordato del Comune di Padova.',
      de: '200 Meter vom Prato della Valle entfernt, unabhängiges Studio mit Küche und Klimaanlage. Offizieller Mietvertrag im Rahmen der Mietpreisbindung (Canone Concordato) der Stadt Padua.',
      ru: 'В 200 метрах от площади Прато делла Валле, отдельная студия с кухней и кондиционером. Официальный студенческий договор в соответствии со шкалой Canone Concordato муниципалитета Падуи.',
      hi: 'प्रातो डेला वैले से 200 मीटर, सुसज्जित रसोई और एसी वाला स्वतंत्र स्टूडियो अपार्टमेंट। पादुआ नगर पालिका के Canone Concordato नियमों के तहत आधिकारिक छात्र अनुबंध।',
    },
    expenses: {
      tr: '+€60 Isıtma & Su Dahil',
      en: '+€60 Heating & Water Included',
      it: '+€60 Riscaldamento e Acqua Inclusi',
      de: '+€60 Heizung & Wasser inklusive',
      ru: '+€60 Отопление и вода включены',
      hi: '+€60 हीटिंग और पानी शामिल',
    },
    fairPriceText: {
      tr: 'Belediye Rayicine Tam Uyumlu (Canone Concordato)',
      en: 'Certified Municipality Rate (Canone Concordato)',
      it: 'Canone Concordato Certificato',
      de: 'Zertifizierte Mietpreisbindung (Canone Concordato)',
      ru: 'Сертифицированная ставка Canone Concordato',
      hi: 'प्रमाणित नगर पालिका किराया (Canone Concordato)',
    },
    distanceToFaculty: {
      tr: 'Santo & Centro (< 300m)',
      en: 'Santo & City Center (< 300m)',
      it: 'Basilica del Santo & Centro (< 300m)',
      de: 'Santo & Stadtzentrum (< 300m)',
      ru: 'Базилика дель Санто и центр (< 300м)',
      hi: 'सैंटो और शहर का केंद्र (< 300मी)',
    },
    confirmationTimeLeft: {
      tr: 'Teyitli: 64s Kaldı',
      en: 'Reconfirmed: 64h Left',
      it: 'Verificato: Mancano 64 ore',
      de: 'Bestätigt: Noch 64 Std.',
      ru: 'Подтверждено: осталось 64ч',
      hi: 'सत्यापित: 64 घंटे शेष',
    },
    compatibilityReason: {
      tr: 'Bireysel Çalışma & Tam Bağımsızlık',
      en: 'Independent Study & Full Privacy',
      it: 'Studio Individuale e Massima Privacy',
      de: 'Individuelles Lernen & Volle Privatsphäre',
      ru: 'Индивидуальная учеба и полное уединение',
      hi: 'स्वतंत्र अध्ययन और पूर्ण गोपनीयता',
    },
  },
  'PD-ARC-105': {
    title: {
      tr: 'Arcella İstasyon Arkası - 2 Kişilik Kız Odasında Paylaşımlı Yatak',
      en: 'Arcella Near Train Station - Shared Bed in Double Room for Female Student',
      it: 'Arcella Vicino alla Stazione - Posto Letto in Doppia per Studentessa',
      de: 'Arcella am Bahnhof - Bett im Doppelzimmer für Studentin',
      ru: 'Арчелла возле вокзала - Место в двухместной комнате для студентки',
      hi: 'आर्सेला स्टेशन के पास - छात्रा के लिए डबल रूम में साझा बिस्तर',
    },
    description: {
      tr: 'Padova Merkez Tren İstasyonuna 6 dakika yürüme mesafesinde, ekonomik ve ferah çift kişilik oda. Resmi Canone Concordato öğrenci sözleşmesi ile tescillidir.',
      en: '6 minutes walk from Padova Central Railway Station, affordable and spacious double room bed. Formally registered under the Canone Concordato student lease framework.',
      it: 'A 6 minuti a piedi dalla Stazione Ferroviaria di Padova, posto letto economico e spazioso. Registrato regolarmente con contratto studenti a Canone Concordato.',
      de: '6 Gehminuten vom Hauptbahnhof Padua entfernt, günstiger und geräumiger Schlafplatz. Offiziell registrierter Studentenmietvertrag (Canone Concordato).',
      ru: 'В 6 минутах ходьбы от центрального вокзала Падуи, доступное и просторное место в комнате. Официально зарегистрирован по схеме Canone Concordato.',
      hi: 'पादुआ सेंट्रल स्टेशन से 6 मिनट की पैदल दूरी, किफायती और विशाल डबल रूम बिस्तर। आधिकारिक Canone Concordato छात्र अनुबंध के तहत पंजीकृत।',
    },
    expenses: {
      tr: '+€25 Giderler',
      en: '+€25 Utilities',
      it: '+€25 Spese',
      de: '+€25 Nebenkosten',
      ru: '+€25 Коммунальные',
      hi: '+€25 अन्य खर्च',
    },
    fairPriceText: {
      tr: 'Öğrenci Bütçesine Uygun (Canone Concordato)',
      en: 'Student Budget Friendly (Canone Concordato)',
      it: 'Canone Agevolato per Studenti (Canone Concordato)',
      de: 'Studentengünstig (Canone Concordato)',
      ru: 'Выгодная студенческая ставка (Canone Concordato)',
      hi: 'छात्र बजट के अनुकूल (Canone Concordato)',
    },
    distanceToFaculty: {
      tr: 'Stazione & Tram (< 400m)',
      en: 'Station & Tram Line (< 400m)',
      it: 'Stazione e Tram (< 400m)',
      de: 'Bahnhof & Straßenbahn (< 400m)',
      ru: 'Вокзал и трамвай (< 400м)',
      hi: 'स्टेशन और ट्राम (< 400मी)',
    },
    confirmationTimeLeft: {
      tr: 'Teyitli: 29s Kaldı',
      en: 'Reconfirmed: 29h Left',
      it: 'Verificato: Mancano 29 ore',
      de: 'Bestätigt: Noch 29 Std.',
      ru: 'Подтверждено: осталось 29ч',
      hi: 'सत्यापित: 29 घंटे शेष',
    },
    compatibilityReason: {
      tr: 'Ekonomik Bütçe & Ulaşım Kolaylığı',
      en: 'Budget-Friendly & Easy Transit',
      it: 'Budget Economico e Massima Mobilità',
      de: 'Günstiges Budget & Gute Anbindung',
      ru: 'Экономичный бюджет и удобный транспорт',
      hi: 'किफायती बजट और आसान परिवहन',
    },
  },
  'PD-GUIZ-106': {
    title: {
      tr: 'Guizza Tramvay Durağı Yanı - Balkonlu Aydınlık Tek Kişilik Oda',
      en: 'Guizza Tram Stop - Bright Single Room with Balcony',
      it: 'Guizza Fermata Tram - Stanza Singola Luminosa con Balcone',
      de: 'Guizza Tram-Haltestelle - Helles Einzelzimmer mit Balkon',
      ru: 'Гуицца возле трамвая - Светлая комната с балконом',
      hi: 'गुइज़ा ट्राम स्टॉप के पास - बालकनी वाला उज्ज्वल सिंगल कमरा',
    },
    description: {
      tr: 'Hızlı tramvay (SIR1) ile merkeze 12 dakikada direkt ulaşım. Sakin ve güvenli mahallede, temiz öğrenci dairesi. Sözleşme resmi Canone Concordato olup oturum iznine uygundur.',
      en: '12 minutes direct connection to city center via SIR1 express tramway. Clean student flat in a safe, quiet neighbourhood. Official Canone Concordato contract suitable for residence permits.',
      it: 'A 12 minuti dal centro tramite tram veloce SIR1. Appartamento pulito in quartiere residenziale tranquillo. Contratto a Canone Concordato valido per permesso di soggiorno.',
      de: '12 Minuten mit der Schnellstraßenbahn SIR1 direkt ins Zentrum. Saubere Studenten-WG in ruhiger Wohngegend. Offizieller Mietvertrag mit Mietpreisbindung (Canone Concordato).',
      ru: '12 минут до центра на скоростном трамвае SIR1. Чистая студенческая квартира в тихом районе. Официальный договор Canone Concordato, подходит для ВНЖ.',
      hi: 'SIR1 एक्सप्रेस ट्राम से शहर के केंद्र तक 12 मिनट में सीधी पहुंच। शांत और सुरक्षित इलाके में साफ-सुथरा छात्र अपार्टमेंट। निवास अनुमति के लिए उपयुक्त आधिकारिक Canone Concordato अनुबंध।',
    },
    expenses: {
      tr: '+€30 Giderler',
      en: '+€30 Utilities',
      it: '+€30 Spese',
      de: '+€30 Nebenkosten',
      ru: '+€30 Коммунальные',
      hi: '+€30 अन्य खर्च',
    },
    fairPriceText: {
      tr: 'Guizza Rayiç Ortalamasında (Canone Concordato)',
      en: 'Aligned with Guizza Average (Canone Concordato)',
      it: 'In Linea con la Media Canone Concordato di Guizza',
      de: 'Im Guizza-Durchschnitt (Canone Concordato)',
      ru: 'В пределах средней ставки Canone Concordato в Гуицце',
      hi: 'गुइज़ा औसत के अनुरूप (Canone Concordato)',
    },
    distanceToFaculty: {
      tr: 'Tramvay Durağı (< 100m)',
      en: 'Tramway Stop (< 100m)',
      it: 'Fermata Tram (< 100m)',
      de: 'Straßenbahnhaltestelle (< 100m)',
      ru: 'Остановка трамвая (< 100м)',
      hi: 'ट्राम स्टॉप (< 100मी)',
    },
    confirmationTimeLeft: {
      tr: 'Teyitli: 52s Kaldı',
      en: 'Reconfirmed: 52h Left',
      it: 'Verificato: Mancano 52 ore',
      de: 'Bestätigt: Noch 52 Std.',
      ru: 'Подтверждено: осталось 52ч',
      hi: 'सत्यापित: 52 घंटे शेष',
    },
    compatibilityReason: {
      tr: 'Huzurlu Ortam & Düzenli Yaşam',
      en: 'Peaceful Environment & Structured Lifestyle',
      it: 'Ambiente Tranquillo e Vita Ordinata',
      de: 'Ruhige Atmosphäre & Geordneter Alltag',
      ru: 'Спокойная обстановка и порядок',
      hi: 'शांत वातावरण और व्यवस्थित जीवनशैली',
    },
  },
};

/**
 * Returns a localized clone of a housing listing in the user's active language
 */
export function getLocalizedListing(listing: HousingListing, lang: Language): HousingListing {
  const i18n = LISTINGS_I18N[listing.id];
  const localizedDistrict = DISTRICT_TRANSLATIONS[lang]?.[listing.district] || listing.district;
  const localizedContract = CONTRACT_TYPE_TRANSLATIONS[lang]?.[listing.contractType] || listing.contractType;
  const localizedRoomType = (ROOM_TYPE_TRANSLATIONS[lang]?.[listing.roomType] || listing.roomType) as RoomType;

  if (!i18n) {
    return {
      ...listing,
      district: localizedDistrict as DistrictArea,
      contractType: localizedContract as ContractType,
      roomType: localizedRoomType,
    };
  }

  return {
    ...listing,
    title: i18n.title[lang] || i18n.title.tr || listing.title,
    description: i18n.description[lang] || i18n.description.tr || listing.description,
    expenses: i18n.expenses[lang] || i18n.expenses.tr || listing.expenses,
    fairPriceText: i18n.fairPriceText[lang] || i18n.fairPriceText.tr || listing.fairPriceText,
    videoTitle: i18n.videoTitle ? (i18n.videoTitle[lang] || listing.videoTitle) : listing.videoTitle,
    distanceToFaculty: i18n.distanceToFaculty ? (i18n.distanceToFaculty[lang] || listing.distanceToFaculty) : listing.distanceToFaculty,
    confirmationTimeLeft: i18n.confirmationTimeLeft ? (i18n.confirmationTimeLeft[lang] || listing.confirmationTimeLeft) : listing.confirmationTimeLeft,
    compatibilityReason: i18n.compatibilityReason ? (i18n.compatibilityReason[lang] || listing.compatibilityReason) : listing.compatibilityReason,
    district: localizedDistrict as DistrictArea,
    contractType: localizedContract as ContractType,
    roomType: localizedRoomType,
  };
}
