import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bus, Crosshair, Footprints, GraduationCap, Loader2, MapPin, Search } from 'lucide-react';
import { DistrictArea, Language } from '../../types';
import {
  AddressSuggestion,
  geocodeAddress,
  reverseGeocode,
  searchAddressSuggestions,
} from '../../services/geocodingService';
import { TRANSLATIONS } from '../../utils/translations';
import { WIZARD_TEXT } from '../../utils/wizardText';
import { Field, inputClass } from '../ui/kit';
import { districtFromCoords, travelEstimate } from './formModel';

interface LocationValue {
  streetAddress: string;
  district: DistrictArea;
  lat: number;
  lng: number;
}

interface LocationFieldProps {
  value: LocationValue;
  onChange: (patch: Partial<LocationValue>) => void;
  lang: Language;
  error?: string | null;
}

const PIN_HTML = `<div style="width:34px;height:34px;transform:translate(-50%,-100%);display:flex;align-items:center;justify-content:center;cursor:grab">
  <svg width="34" height="34" viewBox="0 0 24 24" fill="#ea580c" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round" style="filter:drop-shadow(0 3px 4px rgba(0,0,0,.35))"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="#fff" stroke="none"/></svg>
</div>`;

export const LocationField: React.FC<LocationFieldProps> = ({ value, onChange, lang, error }) => {
  const w = WIZARD_TEXT[lang];
  const t = TRANSLATIONS[lang] || TRANSLATIONS.tr;
  const districtLabels: Record<string, string> = {
    'Policlinico / Tıp Fakültesi (< 500m)': t.districtPoliclinico,
    'Portello / Mühendislik & Fen (< 500m)': t.districtPortello,
    'Beato Pellegrino / Beşeri Bilimler': t.districtBeato,
    'Centro Storico / Prato della Valle': t.districtCentro,
    Forcellini: t.districtForcellini,
    Arcella: t.districtArcella,
    Guizza: 'Guizza',
  };

  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [busy, setBusy] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Harita/öneri seçimi sayacı: eski (yarış halindeki) blur-geocode ve reverse-geocode sonuçlarını iptal eder.
  const pickSeq = useRef(0);
  // Şu anki koordinatların karşılık geldiği adres metni; değişmediyse blur'da tekrar geocode edilmez.
  const resolvedText = useRef(value.streetAddress.trim());

  // Harita olayları yalnızca ilk render'daki kapanışı görür; güncel değerlere ref üzerinden ulaş.
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };

  const applyCoords = (lat: number, lng: number, extra: Partial<LocationValue> = {}) => {
    const { onChange: change } = latest.current;
    const patch: Partial<LocationValue> = { lat, lng, ...extra };
    // Semt her zaman konumdan türetilir; kullanıcı seçmez.
    patch.district = districtFromCoords(lat, lng);
    change(patch);
  };

  const mapEl = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapEl.current || map.current) return;
    const m = L.map(mapEl.current, {
      center: [value.lat, value.lng],
      zoom: 16,
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(m);
    const mk = L.marker([value.lat, value.lng], {
      draggable: true,
      icon: L.divIcon({ className: 'custom-picker-pin', html: PIN_HTML, iconSize: [0, 0] }),
    }).addTo(m);

    const commit = async (lat: number, lng: number) => {
      const la = Number(lat.toFixed(6));
      const ln = Number(lng.toFixed(6));
      const seq = ++pickSeq.current;
      if (debounce.current) clearTimeout(debounce.current);
      setShowSuggestions(false);
      applyCoords(la, ln);
      const rev = await reverseGeocode(la, ln);
      // Bu arada başka bir seçim yapıldıysa eski sonucu uygulama
      if (rev?.streetAddress && seq === pickSeq.current) {
        resolvedText.current = rev.streetAddress.trim();
        latest.current.onChange({ streetAddress: rev.streetAddress });
      }
    };
    mk.on('dragend', () => {
      const p = mk.getLatLng();
      commit(p.lat, p.lng);
    });
    m.on('click', (e: L.LeafletMouseEvent) => {
      mk.setLatLng(e.latlng);
      commit(e.latlng.lat, e.latlng.lng);
    });
    map.current = m;
    marker.current = mk;
    const timers = [100, 350].map((d) => setTimeout(() => m.invalidateSize(), d));
    return () => {
      timers.forEach(clearTimeout);
      m.remove();
      map.current = null;
      marker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!map.current || !marker.current) return;
    marker.current.setLatLng([value.lat, value.lng]);
    map.current.setView([value.lat, value.lng], map.current.getZoom(), { animate: true });
  }, [value.lat, value.lng]);

  const onAddressInput = (text: string) => {
    onChange({ streetAddress: text });
    if (debounce.current) clearTimeout(debounce.current);
    if (text.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounce.current = setTimeout(async () => {
      setBusy(true);
      const results = await searchAddressSuggestions(text);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setBusy(false);
    }, 400);
  };

  const pickSuggestion = (s: AddressSuggestion) => {
    pickSeq.current++;
    resolvedText.current = s.streetName.trim();
    if (debounce.current) clearTimeout(debounce.current);
    setShowSuggestions(false);
    applyCoords(s.lat, s.lng, { streetAddress: s.streetName });
  };

  const onBlur = () => {
    const seq = pickSeq.current;
    setTimeout(async () => {
      setShowSuggestions(false);
      const text = latest.current.value.streetAddress.trim();
      // Harita/öneri seçimi blur'dan sonra yapıldıysa ya da metin zaten çözülmüşse dokunma
      if (text.length < 3 || seq !== pickSeq.current || text === resolvedText.current) return;
      setBusy(true);
      const r = await geocodeAddress(text, latest.current.value.district);
      if (r?.lat && r?.lng && seq === pickSeq.current) {
        resolvedText.current = text;
        applyCoords(r.lat, r.lng);
      }
      setBusy(false);
    }, 200);
  };

  const travel = travelEstimate(value.lat, value.lng, lang);

  return (
    <div className="space-y-3">
      <Field
        label={w.locationLabel}
        htmlFor="wiz-address"
        help={w.locationHelp}
        error={error}
        hint={error ? undefined : w.locationHelp}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            id="wiz-address"
            type="text"
            autoComplete="off"
            value={value.streetAddress}
            onChange={(e) => onAddressInput(e.target.value)}
            onBlur={onBlur}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && showSuggestions) e.preventDefault();
            }}
            placeholder={w.addressPlaceholder}
            className={`${inputClass(Boolean(error))} pl-10 pr-10`}
          />
          {busy && <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-orange-600" />}

          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-full z-[600] mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-lg">
              {suggestions.map((s, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pickSuggestion(s);
                    }}
                    className="flex min-h-[44px] w-full items-start gap-2.5 border-b border-stone-100 px-3.5 py-2.5 text-left last:border-b-0 hover:bg-orange-50 cursor-pointer"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-stone-900">{s.streetName}</span>
                      <span className="block truncate text-[13px] text-stone-500">{s.displayName}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Field>

      <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
        <div ref={mapEl} className="h-56 w-full sm:h-64" />
        <button
          type="button"
          onClick={() => map.current?.setView([value.lat, value.lng], 16, { animate: true })}
          aria-label={t.mapCenter}
          className="absolute right-2.5 top-2.5 z-[400] flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 shadow-sm hover:text-orange-600 cursor-pointer"
        >
          <Crosshair className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-stone-600">
            <MapPin className="h-4 w-4 text-orange-600" />
            {w.districtLabel}
          </p>
          <p className="mt-0.5 text-sm font-bold leading-snug text-stone-900" aria-live="polite">
            {districtLabels[value.district] ?? value.district}
          </p>
          <p className="mt-1 text-[13px] text-stone-500">{w.districtAuto}</p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-stone-600">
            <GraduationCap className="h-4 w-4 text-orange-600" />
            {w.nearestUni}
          </p>
          <p className="mt-0.5 truncate text-sm font-bold text-stone-900">{travel.name}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-stone-700">
            <span className="inline-flex items-center gap-1">
              <Footprints className="h-3.5 w-3.5 text-stone-500" />
              {travel.walkMinutes} {w.min}
              <span className="text-stone-500">{w.walk}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Bus className="h-3.5 w-3.5 text-stone-500" />
              <span className="text-stone-500">{w.bus}</span> {travel.busMinutes} {w.min}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
