import { HousingListing, Language, ContractType, DistrictArea, RoomType } from '../types';
import { insightText } from './fairPrice';
import type { PriceInsight } from './districtPricing';
import { calculateNearestFaculty } from '../services/geocodingService';
import { WIZARD_TEXT } from './wizardText';
import { TRANSLATIONS } from './translations';
import { LANG_LOCALE } from './wizardText';
import { EXPIRED_ARCHIVE_REASON, confirmationDeadlineMs, formatTimeLeft } from './listingExpiry';

// Kullanıcının yazdığı gider metni ("+€40 Giderler" / "Giderler dahil") kullanıcının diline çevrilir.
// Yayındaki ilanın etiketi teyit süresinden hesaplanır ("Teyitli: 4g 6s kaldı"); arşivdekiler kayıtlı metinden çevrilir.
const localizeConfirmation = (listing: HousingListing, lang: Language): string => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.tr;
  if (listing.isArchived) {
    if (listing.archiveReason === EXPIRED_ARCHIVE_REASON) return t.expiredArchived;
    const known: Record<string, string> = {
      [TRANSLATIONS.tr.confirmedArchived]: t.confirmedArchived,
    };
    return known[listing.confirmationTimeLeft] ?? listing.confirmationTimeLeft;
  }
  const left = confirmationDeadlineMs(listing) - Date.now();
  if (!Number.isFinite(left) || left <= 0) return t.expiredArchived;
  return t.confirmedTimeLeft.replace('{time}', formatTimeLeft(left, lang));
};

const localizeExpenses = (expenses: string, lang: Language): string => {
  if (!expenses) return expenses;
  const w = WIZARD_TEXT[lang];
  const amount = /(\d+(?:[.,]\d+)?)/.exec(expenses);
  return amount ? `+€${amount[1]} ${w.expensesExtraText}` : w.expensesIncludedText;
};

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

/**
 * Returns a localized clone of a housing listing in the user's active language
 */
function localizeListingBase(listing: HousingListing, lang: Language, insight?: PriceInsight): HousingListing {
  const localizedDistrict = DISTRICT_TRANSLATIONS[lang]?.[listing.district] || listing.district;
  const localizedContract = CONTRACT_TYPE_TRANSLATIONS[lang]?.[listing.contractType] || listing.contractType;
  const localizedRoomType = (ROOM_TYPE_TRANSLATIONS[lang]?.[listing.roomType] || listing.roomType) as RoomType;

  return {
    ...listing,
    // Fiyat karşılaştırması sitedeki güncel ilanlardan hesaplanır; sağlanmadıysa kayıtlı metin kullanılır.
    fairPriceText: insight ? insightText(insight, lang) : listing.fairPriceText,
    fairPriceStatus: insight ? (insight.status === 'unknown' ? 'average' : insight.status) : listing.fairPriceStatus,
    expenses: localizeExpenses(listing.expenses, lang),
    confirmationTimeLeft: localizeConfirmation(listing, lang),
    // Konum biliniyorsa yürüme süresi metni kullanıcının diliyle yeniden üretilir.
    distanceToFaculty:
      typeof listing.lat === 'number' && typeof listing.lng === 'number'
        ? calculateNearestFaculty(listing.lat, listing.lng, lang).formattedText
        : listing.distanceToFaculty,
    district: localizedDistrict as DistrictArea,
    contractType: localizedContract as ContractType,
    roomType: localizedRoomType,
  };
}

// Sözleşme tarihleri ISO değerden kullanıcının diliyle yeniden biçimlenir (kayıtlı metin yazarın dilindedir).
const formatIsoDate = (iso: string | undefined, lang: Language): string | undefined => {
  const m = iso ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso) : null;
  if (!m) return undefined;
  return new Intl.DateTimeFormat(LANG_LOCALE[lang], { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  );
};

export function getLocalizedListing(listing: HousingListing, lang: Language, insight?: PriceInsight): HousingListing {
  const base = localizeListingBase(listing, lang, insight);
  return {
    ...base,
    contractStartDate: formatIsoDate(listing.contractStartISO, lang) ?? base.contractStartDate,
    contractEndDate: formatIsoDate(listing.contractEndISO, lang) ?? base.contractEndDate,
  };
}
