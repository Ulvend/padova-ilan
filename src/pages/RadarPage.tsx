import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Calendar, GraduationCap, Hourglass, Pencil, Plus, Radar, Trash2, Users, Video } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LoginRequired } from '../components/LoginRequired';
import { StartDatePanel } from '../components/StartDateFilter';
import { Card, SectionTitle, inputClass } from '../components/ui/kit';
import { MIN_RENT, PriceRangeSlider, formatRentBound } from '../components/ui/PriceRangeSlider';
import { toISO } from '../components/ui/DateRangePicker';
import { DISTRICT_TRANSLATIONS } from '../utils/listingTranslator';
import { fillText } from '../utils/homeText';
import { LANG_LOCALE } from '../utils/locale';
import { matchesListingFilters, MAX_PRICE_UNLIMITED } from '../utils/listingFilters';
import { EMPTY_CRITERIA, MAX_RADARS, criteriaToFilters, hasAnyCriterion } from '../utils/radar';
import type { FilterState, ListingRadar, RadarCriteria } from '../types';

const optionChip = (active: boolean) =>
  `min-h-[40px] px-3.5 rounded-full border text-sm font-semibold transition cursor-pointer active:scale-95 flex items-center gap-1.5 ${
    active ? 'bg-stone-900 border-stone-900 text-white' : 'bg-white text-stone-800 border-stone-300 hover:border-stone-500'
  }`;

const fieldLabel = 'text-[13px] font-semibold text-stone-700 flex items-center gap-1.5';

const criteriaOf = (r: ListingRadar): RadarCriteria => ({
  district: r.district,
  rentalTerm: r.rentalTerm,
  roomType: r.roomType,
  contractType: r.contractType,
  minPrice: r.minPrice,
  maxPrice: r.maxPrice,
  startFrom: r.startFrom,
  startTo: r.startTo,
  maxStayMonths: r.maxStayMonths,
  gender: r.gender,
  onlyVideoTour: r.onlyVideoTour,
  onlyStudentVerified: r.onlyStudentVerified,
  onlySubentro: r.onlySubentro,
});

export const RadarPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    t,
    currentLang,
    publicListings,
    radars,
    handleSaveRadar,
    handleToggleRadar,
    handleDeleteRadar,
    setFilters,
    isLoggedIn,
    authReady,
    emailVerified,
  } = useApp();

  // Ana sayfadaki "Radara ekle" düğmesi filtreleri route state'i ile taşır.
  const draft = (location.state as { draft?: RadarCriteria } | null)?.draft;
  const [criteria, setCriteria] = useState<RadarCriteria>(draft ?? EMPTY_CRITERIA);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fromFilters, setFromFilters] = useState(Boolean(draft));
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Taşınan taslak bir kez kullanılır; sayfa yenilenince ya da geri gelinince tekrar dolmasın.
  useEffect(() => {
    if (draft) navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!confirmDeleteId) return;
    const timer = setTimeout(() => setConfirmDeleteId(null), 4000);
    return () => clearTimeout(timer);
  }, [confirmDeleteId]);

  const todayIso = toISO(new Date());
  const countMatches = (c: RadarCriteria) => {
    const filters = criteriaToFilters(c);
    return publicListings.filter((l) => matchesListingFilters(l, filters, todayIso)).length;
  };
  const previewCount = useMemo(() => countMatches(criteria), [criteria, publicListings, todayIso]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = (updates: Partial<RadarCriteria>) => {
    setFromFilters(false);
    setCriteria((prev) => ({ ...prev, ...updates }));
  };

  const districtLabel = (d: string) => DISTRICT_TRANSLATIONS[currentLang]?.[d] || d;
  const districtOptions: { value: string; label: string }[] = [
    { value: 'Policlinico / Tıp Fakültesi (< 500m)', label: t.districtPoliclinico },
    { value: 'Portello / Mühendislik & Fen (< 500m)', label: t.districtPortello },
    { value: 'Beato Pellegrino / Beşeri Bilimler', label: t.districtBeato },
    { value: 'Centro Storico', label: t.districtCentro },
    { value: 'Prato della Valle', label: t.districtPrato },
  ];
  const contractOptions: { value: string; label: string }[] = [
    { value: 'Contratto per Studenti (Canone Concordato)', label: t.contractOptionStudent },
    { value: 'Contratto Transitorio (1-18 Ay)', label: t.contractOptionTransitorio },
    { value: 'Standart 4+4 / 3+2 Yıllık', label: t.contractOptionStandard },
  ];
  const stayOptions = [
    { months: 0, label: t.stayAny },
    { months: 3, label: t.stayUpTo3 },
    { months: 6, label: t.stayUpTo6 },
    { months: 12, label: t.stayUpTo12 },
  ];
  const genderOptions: { value: RadarCriteria['gender']; label: string }[] = [
    { value: undefined, label: t.genderFilterAny },
    { value: 'female', label: t.genderFilterFemale },
    { value: 'male', label: t.genderFilterMale },
  ];

  const formatDate = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Intl.DateTimeFormat(LANG_LOCALE[currentLang], { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(y, m - 1, d));
  };

  const summaryChips = (c: RadarCriteria): string[] => {
    const chips: string[] = [];
    if (c.district) chips.push(districtLabel(c.district).split(' / ')[0]);
    if (c.rentalTerm) chips.push(c.rentalTerm === 'short' ? t.termShort : t.termLong);
    if (c.roomType) chips.push(c.roomType);
    if (c.contractType) chips.push(contractOptions.find((o) => o.value === c.contractType)?.label.split(' (')[0] ?? c.contractType);
    if (c.minPrice && c.maxPrice) chips.push(`€${c.minPrice} – €${c.maxPrice}`);
    else if (c.minPrice) chips.push(`≥ €${c.minPrice}`);
    else if (c.maxPrice) chips.push(`≤ €${c.maxPrice}`);
    if (c.startFrom) {
      chips.push(c.startTo ? `${formatDate(c.startFrom)} – ${formatDate(c.startTo)}` : fillText(t.startFromOnwards, { date: formatDate(c.startFrom) }));
    }
    if (c.maxStayMonths) chips.push(stayOptions.find((o) => o.months === c.maxStayMonths)?.label ?? `${c.maxStayMonths}`);
    if (c.gender) chips.push(c.gender === 'female' ? t.genderFilterFemale : t.genderFilterMale);
    if (c.onlyVideoTour) chips.push(t.tabVideo);
    if (c.onlyStudentVerified) chips.push(t.verifiedStudent);
    if (c.onlySubentro) chips.push(t.tabSubentro);
    return chips;
  };

  const resetForm = () => {
    setCriteria(EMPTY_CRITERIA);
    setName('');
    setEditingId(null);
    setFromFilters(false);
  };

  const startEdit = (r: ListingRadar) => {
    setEditingId(r.id);
    setName(r.name);
    setCriteria(criteriaOf(r));
    setFromFilters(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !name.trim()) return;
    setSaving(true);
    // Tüm anahtarlar açıkça gönderilir: boş bırakılan kriter veritabanında da temizlenir.
    const ok = await handleSaveRadar(
      {
        name: name.trim(),
        district: criteria.district,
        rentalTerm: criteria.rentalTerm,
        roomType: criteria.roomType,
        contractType: criteria.contractType,
        minPrice: criteria.minPrice,
        maxPrice: criteria.maxPrice,
        startFrom: criteria.startFrom,
        startTo: criteria.startFrom ? criteria.startTo : undefined,
        maxStayMonths: criteria.maxStayMonths,
        gender: criteria.gender,
        onlyVideoTour: criteria.onlyVideoTour,
        onlyStudentVerified: criteria.onlyStudentVerified,
        onlySubentro: criteria.onlySubentro,
      },
      editingId ?? undefined
    );
    setSaving(false);
    if (ok) resetForm();
  };

  const showMatches = (r: ListingRadar) => {
    setFilters(criteriaToFilters(criteriaOf(r)) as FilterState);
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!authReady) return null;

  const header = (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
          <Radar className="w-6 h-6" />
        </div>
        <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight text-stone-900">{t.radarTitle}</h1>
      </div>
      <p className="text-base leading-relaxed text-stone-600">{t.radarIntro}</p>
      <ol className="flex flex-wrap gap-2.5">
        {[t.radarStep1, t.radarStep2, t.radarStep3].map((step, i) => (
          <li key={i} className="flex items-center gap-2 rounded-full bg-white border border-stone-200 pl-1.5 pr-4 py-1.5 text-sm font-semibold text-stone-800">
            <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
            {step}
          </li>
        ))}
      </ol>
    </section>
  );

  if (!isLoggedIn) {
    return (
      <div className="space-y-8">
        {header}
        <LoginRequired title={t.radarLoginTitle} body={t.radarLoginBody} icon={<Radar className="w-8 h-8" />} />
      </div>
    );
  }

  const rentLow = criteria.minPrice ?? MIN_RENT;
  const rentHigh = criteria.maxPrice ?? MAX_PRICE_UNLIMITED;
  const atLimit = !editingId && radars.length >= MAX_RADARS;
  const startFilters = criteriaToFilters(criteria);

  return (
    <div className="space-y-8">
      {header}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <SectionTitle hint={t.radarAnyHint}>{editingId ? t.radarEditTitle : t.radarNewTitle}</SectionTitle>

          {fromFilters && (
            <p className="mb-4 rounded-xl bg-orange-50 border border-orange-200 px-3.5 py-2.5 text-[13px] font-medium text-orange-900">{t.radarFromFilters}</p>
          )}
          {!emailVerified && (
            <p className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-[13px] font-medium text-amber-900">{t.radarNeedEmail}</p>
          )}

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="radar-name" className={fieldLabel}>
                {t.radarNameLabel}
              </label>
              <input
                id="radar-name"
                type="text"
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.radarNamePlaceholder}
                className={inputClass()}
                required
              />
            </div>

            <div className="space-y-2">
              <span className={fieldLabel}>
                <Hourglass className="w-3.5 h-3.5 text-orange-600" />
                {t.termLabel}
              </span>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t.termLabel}>
                {([
                  [undefined, t.termAll],
                  ['long', t.termLong],
                  ['short', t.termShort],
                ] as const).map(([value, label]) => (
                  <button key={label} type="button" onClick={() => patch({ rentalTerm: value })} aria-pressed={criteria.rentalTerm === value} className={optionChip(criteria.rentalTerm === value)}>
                    {label}
                  </button>
                ))}
              </div>
              {criteria.rentalTerm === 'short' && <p className="text-[13px] text-stone-500">{t.termShortHint}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label htmlFor="radar-district" className={fieldLabel}>
                  {t.areaProximityLabel}
                </label>
                <select id="radar-district" value={criteria.district ?? 'all'} onChange={(e) => patch({ district: e.target.value === 'all' ? undefined : e.target.value })} className={inputClass()}>
                  <option value="all">{t.allAreas}</option>
                  {districtOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="radar-room" className={fieldLabel}>
                  {t.roomTypeLabel}
                </label>
                <select id="radar-room" value={criteria.roomType ?? 'all'} onChange={(e) => patch({ roomType: e.target.value === 'all' ? undefined : e.target.value })} className={inputClass()}>
                  <option value="all">{t.allRoomTypes}</option>
                  <option value="Singola">{t.singleRoomOption}</option>
                  <option value="Doppia">{t.doubleRoomOption}</option>
                  <option value="Monolocale">{t.studioOption}</option>
                  <option value="Bilocale">{t.bilocaleOption}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="radar-contract" className={fieldLabel}>
                  {t.contractTypeLabel}
                </label>
                <select id="radar-contract" value={criteria.contractType ?? 'all'} onChange={(e) => patch({ contractType: e.target.value === 'all' ? undefined : e.target.value })} className={inputClass()}>
                  <option value="all">{t.stayAny}</option>
                  {contractOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className={fieldLabel}>{t.rentRangeLabel}</span>
                <span className="text-sm font-bold text-stone-900">
                  {rentLow <= MIN_RENT && rentHigh >= MAX_PRICE_UNLIMITED ? t.rentAnyRange : `${formatRentBound(rentLow)} – ${formatRentBound(rentHigh)}`}
                </span>
              </div>
              <PriceRangeSlider
                low={rentLow}
                high={rentHigh}
                onChange={(min, max) => patch({ minPrice: min > MIN_RENT ? min : undefined, maxPrice: max >= MAX_PRICE_UNLIMITED ? undefined : max })}
                lowLabel={t.rentMinLabel}
                highLabel={t.rentMaxLabel}
                idPrefix="radar-rent"
              />
              <div className="flex justify-between text-[12px] font-medium text-stone-500">
                <span>
                  {t.rentMinLabel}: {formatRentBound(rentLow)}
                </span>
                <span>
                  {t.rentMaxLabel}: {formatRentBound(rentHigh)}
                </span>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <span className={fieldLabel}>
                  <Users className="w-3.5 h-3.5 text-orange-600" />
                  {t.genderFilterLabel}
                </span>
                <div className="flex flex-wrap gap-2" role="group" aria-label={t.genderFilterLabel}>
                  {genderOptions.map(({ value, label }) => (
                    <button key={label} type="button" onClick={() => patch({ gender: value })} aria-pressed={criteria.gender === value} className={optionChip(criteria.gender === value)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <span className={fieldLabel}>
                  <Hourglass className="w-3.5 h-3.5 text-orange-600" />
                  {t.stayLabel}
                </span>
                <div className="flex flex-wrap gap-2" role="group" aria-label={t.stayLabel}>
                  {stayOptions.map(({ months, label }) => (
                    <button key={months} type="button" onClick={() => patch({ maxStayMonths: months || undefined })} aria-pressed={(criteria.maxStayMonths ?? 0) === months} className={optionChip((criteria.maxStayMonths ?? 0) === months)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => patch({ onlyVideoTour: !criteria.onlyVideoTour })} aria-pressed={criteria.onlyVideoTour} className={optionChip(criteria.onlyVideoTour)}>
                <Video className="w-4 h-4" />
                {t.tabVideo}
              </button>
              <button type="button" onClick={() => patch({ onlyStudentVerified: !criteria.onlyStudentVerified })} aria-pressed={criteria.onlyStudentVerified} className={optionChip(criteria.onlyStudentVerified)}>
                <GraduationCap className="w-4 h-4" />
                {t.verifiedStudent}
              </button>
              <button type="button" onClick={() => patch({ onlySubentro: !criteria.onlySubentro })} aria-pressed={criteria.onlySubentro} className={optionChip(criteria.onlySubentro)}>
                {t.tabSubentro}
              </button>
            </div>

            <div className="space-y-2">
              <span className={fieldLabel}>
                <Calendar className="w-3.5 h-3.5 text-orange-600" />
                {t.stayDatesLabel}
              </span>
              <div className="max-w-[360px] rounded-2xl border border-stone-200 p-3">
                <StartDatePanel
                  filters={startFilters}
                  onFilterChange={(u) => patch({ startFrom: u.contractStartFrom, startTo: u.contractStartTo })}
                  currentLang={currentLang}
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-bold text-stone-900" aria-live="polite">
              {previewCount > 0 ? fillText(t.radarPreviewCount, { n: previewCount }) : t.radarPreviewNone}
            </p>
            {!hasAnyCriterion(criteria) && <p className="text-[13px] text-amber-700">{t.radarNoCriteriaWarn}</p>}
            <p className="text-[13px] text-stone-500">{t.radarWhereNote}</p>
            {atLimit && <p className="text-[13px] font-semibold text-rose-700">{fillText(t.radarLimitNote, { n: radars.length, max: MAX_RADARS })}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(editingId || name || hasAnyCriterion(criteria)) && (
              <button type="button" onClick={resetForm} className="min-h-[46px] px-4 rounded-xl text-sm font-semibold text-stone-600 hover:text-stone-900 cursor-pointer">
                {t.radarCancelEdit}
              </button>
            )}
            <button
              type="submit"
              disabled={saving || atLimit || !name.trim() || !emailVerified}
              className="min-h-[46px] px-6 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-sm font-bold flex items-center gap-2 cursor-pointer transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              {editingId ? t.radarUpdateBtn : t.radarSaveBtn}
            </button>
          </div>
        </div>
      </form>

      <section className="space-y-4" aria-labelledby="radar-list-title">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="radar-list-title" className="font-display font-bold text-2xl text-stone-900">
            {t.radarMyRadars}
          </h2>
          <span className="text-sm text-stone-500">
            {radars.length}/{MAX_RADARS}
          </span>
        </div>

        {radars.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-5 py-8 text-center text-sm text-stone-500">{t.radarEmpty}</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {radars.map((r) => {
              const matches = countMatches(criteriaOf(r));
              const chips = summaryChips(criteriaOf(r));
              return (
                <li key={r.id} className={`rounded-2xl border bg-white p-5 space-y-3 ${r.active ? 'border-stone-200' : 'border-stone-200 opacity-70'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-stone-900 truncate">{r.name}</h3>
                      <p className={`text-xs font-semibold ${r.active ? 'text-emerald-700' : 'text-stone-500'}`}>{r.active ? t.radarActive : t.radarPaused}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={r.active}
                      aria-label={`${r.name}: ${r.active ? t.radarActive : t.radarPaused}`}
                      onClick={() => handleToggleRadar(r.id, !r.active)}
                      className={`relative w-11 h-6 rounded-full shrink-0 transition cursor-pointer ${r.active ? 'bg-emerald-600' : 'bg-stone-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${r.active ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {chips.length > 0 ? (
                      chips.map((c, i) => (
                        <span key={i} className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-stone-500">{t.stayAny}</span>
                    )}
                  </div>

                  <p className="text-[13px] text-stone-500 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 shrink-0" />
                    {r.lastNotifiedAt ? fillText(t.radarLastNotified, { date: formatDate(r.lastNotifiedAt.slice(0, 10)) }) : t.radarNeverNotified}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button type="button" onClick={() => showMatches(r)} className="min-h-[40px] px-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold cursor-pointer">
                      {fillText(t.radarMatchesNow, { n: matches })} · {t.radarViewMatches}
                    </button>
                    <button type="button" onClick={() => startEdit(r)} className="min-h-[40px] px-3 rounded-xl border border-stone-300 hover:border-stone-500 text-sm font-semibold text-stone-800 flex items-center gap-1.5 cursor-pointer">
                      <Pencil className="w-3.5 h-3.5" />
                      {t.radarEditBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => (confirmDeleteId === r.id ? (setConfirmDeleteId(null), handleDeleteRadar(r.id)) : setConfirmDeleteId(r.id))}
                      className={`min-h-[40px] px-3 rounded-xl border text-sm font-semibold flex items-center gap-1.5 cursor-pointer ${
                        confirmDeleteId === r.id ? 'bg-rose-600 border-rose-600 text-white' : 'border-stone-300 hover:border-rose-400 text-stone-700 hover:text-rose-700'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {confirmDeleteId === r.id ? t.radarDeleteConfirm : t.radarDeleteBtn}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};
