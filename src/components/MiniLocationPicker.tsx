import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Crosshair, CheckCircle2, Loader2 } from 'lucide-react';
import { Language } from '../types';

interface MiniLocationPickerProps {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
  address: string;
  isGeocoding: boolean;
  nearestFacultyText?: string;
  currentLang: Language;
}

export const MiniLocationPicker: React.FC<MiniLocationPickerProps> = ({
  lat,
  lng,
  onLocationChange,
  address,
  isGeocoding,
  nearestFacultyText,
  currentLang,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Initialize mini Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = lat || 45.4064;
      const initialLng = lng || 11.8768;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Pin marker with drag support
      const markerHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; cursor: grab; user-select: none;">
          <div style="background: #ea580c; color: #ffffff; border: 2px solid #ffffff; padding: 4px 8px; font-weight: 800; font-size: 11px; white-space: nowrap; box-shadow: 0 4px 10px rgba(234, 88, 12, 0.4); border-radius: 9999px; display: flex; align-items: center; gap: 4px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>${currentLang === 'it' ? 'Posizione' : currentLang === 'en' ? 'Exact Pin' : 'İlan Konumu'}</span>
          </div>
          <div style="width: 8px; height: 8px; background: #ea580c; border-right: 2px solid #ffffff; border-bottom: 2px solid #ffffff; transform: rotate(45deg); margin-top: -4px;"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-picker-pin',
        html: markerHtml,
        iconSize: [90, 38],
        iconAnchor: [45, 36],
      });

      const marker = L.marker([initialLat, initialLng], {
        icon: customIcon,
        draggable: true,
      }).addTo(map);

      marker.on('dragend', (e) => {
        const markerPos = e.target.getLatLng();
        onLocationChange(Number(markerPos.lat.toFixed(6)), Number(markerPos.lng.toFixed(6)));
      });

      map.on('click', (e) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        marker.setLatLng([clickLat, clickLng]);
        onLocationChange(Number(clickLat.toFixed(6)), Number(clickLng.toFixed(6)));
      });

      markerRef.current = marker;
      mapInstanceRef.current = map;
    }

    const timers = [100, 300].map((delay) =>
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, delay)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  // Update marker position & pan map when lat/lng change from parent (e.g. Geocoding)
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.setView([lat, lng], 16, { animate: true });
    }
  }, [lat, lng]);

  const handleCenter = () => {
    if (mapInstanceRef.current && lat && lng) {
      mapInstanceRef.current.setView([lat, lng], 16, { animate: true });
    }
  };

  const labels = {
    tr: {
      geocodingActive: 'Gerçek koordinatlar taranıyor...',
      geocodingSuccess: 'OpenStreetMap ile Gerçek Konum Doğrulandı',
      dragHint: 'Haritaya tıklayarak veya iğneyi sürükleyerek bina girişini hassaslaştırabilirsiniz.',
      nearest: 'En Yakın UniPD Kampüsü:',
      recenter: 'Ortala',
    },
    it: {
      geocodingActive: 'Ricerca coordinate reali in corso...',
      geocodingSuccess: 'Posizione reale verificata tramite OpenStreetMap',
      dragHint: 'Clicca sulla mappa o trascina il cursore per perfezionare il punto esatto.',
      nearest: 'Campus UniPD più vicino:',
      recenter: 'Centra',
    },
    en: {
      geocodingActive: 'Fetching real coordinates...',
      geocodingSuccess: 'Real Location Verified via OpenStreetMap',
      dragHint: 'Click on the map or drag the pin to pinpoint the exact building entrance.',
      nearest: 'Closest UniPD Campus:',
      recenter: 'Recenter',
    },
    de: {
      geocodingActive: 'Echte Koordinaten werden gesucht...',
      geocodingSuccess: 'Echter Standort über OpenStreetMap verifiziert',
      dragHint: 'Klicken Sie auf die Karte oder ziehen Sie die Stecknadel, um den Eingang zu markieren.',
      nearest: 'Nächstgelegener UniPD-Campus:',
      recenter: 'Zentrieren',
    },
    ru: {
      geocodingActive: 'Поиск реальных координат...',
      geocodingSuccess: 'Точное местоположение подтверждено через OpenStreetMap',
      dragHint: 'Кликните на карту или переместите метку для точного указания входа.',
      nearest: 'Ближайший кампус UniPD:',
      recenter: 'Центр',
    },
    hi: {
      geocodingActive: 'वास्तविक निर्देशांक खोजे जा रहे हैं...',
      geocodingSuccess: 'OpenStreetMap के माध्यम से वास्तविक स्थान सत्यापित',
      dragHint: 'सटीक इमारत का चयन करने के लिए मानचित्र पर क्लिक करें या पिन को खींचें।',
      nearest: 'निकटतम UniPD परिसर:',
      recenter: 'केंद्र',
    },
  };

  const t = labels[currentLang] || labels.en;

  return (
    <div className="space-y-2">
      {/* Geocoding Status Bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-[11px]">
        <div className="flex items-center gap-1.5 min-w-0">
          {isGeocoding ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-orange-600 animate-spin shrink-0" />
              <span className="text-stone-600 truncate">{t.geocodingActive}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold text-emerald-800 truncate">{t.geocodingSuccess}</span>
            </>
          )}
        </div>
        <div className="font-mono text-[10px] text-stone-500 bg-white px-2 py-0.5 rounded-md border border-stone-200 shrink-0">
          {lat ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : '45.40640, 11.87680'}
        </div>
      </div>

      {/* Mini Leaflet Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-stone-200 shadow-inner h-44 w-full bg-stone-100">
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {/* Recenter Button */}
        <button
          type="button"
          onClick={handleCenter}
          title={t.recenter}
          className="absolute top-2.5 right-2.5 z-[400] bg-white/95 hover:bg-white text-stone-700 hover:text-orange-600 p-2 rounded-xl shadow-md border border-stone-200 transition cursor-pointer flex items-center gap-1 text-[11px] font-medium"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.recenter}</span>
        </button>

        {/* Bottom overlay badge */}
        <div className="absolute bottom-2 left-2 right-2 z-[400] bg-white/90 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-stone-200/80 shadow-xs flex items-center justify-between text-[10px] text-stone-600 pointer-events-none">
          <div className="flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 text-orange-600 shrink-0" />
            <span className="truncate">{address || 'Padova'}</span>
          </div>
          <span className="hidden sm:inline font-mono text-[9px] text-stone-400 shrink-0">OSM Live Geocoding</span>
        </div>
      </div>

      {/* Proximity / Faculty Notice & Hint */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] text-stone-500 px-1">
        <span>{t.dragHint}</span>
        {nearestFacultyText && (
          <span className="font-semibold text-orange-900 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md self-start sm:self-auto">
            🎓 {nearestFacultyText}
          </span>
        )}
      </div>
    </div>
  );
};
