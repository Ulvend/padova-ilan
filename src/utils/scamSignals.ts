// Kiralık ev dolandırıcılığında sık görülen kalıpları mesaj metninde arar (İtalyanca, İngilizce, Türkçe, Almanca, Rusça).
// Bu bir kesin karar değil, alıcıyı uyaran bir işarettir; meşru bir "caparra" konuşması tek başına işaretlenmez.
//
// Puanlama: güçlü kalıp 2 puan; "para", "yurt dışı/uzaktan", "görmeden ön ödeme" ve "platform dışı" gruplarının her biri 1 puan.
// Toplam 2 ve üzeri ise mesaj işaretlenir (ör. "yurt dışındayım + depozito gönder", "caparra prima della visita").

const STRONG: RegExp[] = [
  /western\s*union|money\s*gram|moneygram|ria\s+money|paysafe/i,
  /\biban\b/i,
  // Gerçek bir IBAN dizisi: 2 harf + 2 rakam + 3-7 dörtlü grup (boşluklu ya da bitişik)
  /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,4})?\b/,
  /gift\s*card|google\s*play\s*card|carta\s+regalo|hediye\s*kart|bitcoin|\busdt\b|crypto|criptovalut|kripto/i,
];

const MONEY =
  /deposit|caparra|cauzione|anticipo|acconto|bonifico|postepay|paypal|wire\s*transfer|depozito|kapora|havale|\beft\b|papara|kaution|vorkasse|überweis|залог|предоплат|задаток|перевод/i;

const ABSENT =
  /abroad|out\s+of\s+(?:the\s+)?(?:country|town)|not\s+in\s+(?:italy|padova|padua|the\s+country)|(?:sono|sto)\s+all['’]?\s*estero|fuori\s+(?:dall['’]?\s*)?(?:italia|padova)|non\s+(?:sono|mi\s+trovo)\s+in\s+italia|corriere|courier|yurt\s*d[ıi]ş[ıi]|ülke\s*d[ıi]ş[ıi]|kargo|im\s+ausland|nicht\s+in\s+(?:italien|padua)|kurier|за\s+границ|в\s+другой\s+страна|курьер/i;

const PREPAY =
  /before\s+(?:the\s+)?(?:viewing|visit|seeing|you\s+see|meeting)|without\s+(?:a\s+)?(?:viewing|visit|seeing)|prima\s+(?:della|di\s+(?:fare\s+la\s+)?)\s*(?:visita|vedere|vedere\s+la\s+casa)|senza\s+(?:visita|vedere)|görmeden|görmeden\s+önce|gezmeden|önce\s+(?:depozito|kapora|para)|vor\s+(?:der\s+)?besichtigung|ohne\s+besichtigung|до\s+(?:просмотра|осмотра)|не\s+видя/i;

const OFF_PLATFORM = /whats\s*app|telegram|signal\b|wechat|\bwa\.me\b|t\.me\//i;

export type ScamSignals = { flagged: boolean; score: number };

export function detectScamSignals(text: string): ScamSignals {
  if (!text) return { flagged: false, score: 0 };
  let score = STRONG.some((re) => re.test(text)) ? 2 : 0;
  for (const re of [MONEY, ABSENT, PREPAY, OFF_PLATFORM]) if (re.test(text)) score += 1;
  return { flagged: score >= 2, score };
}
