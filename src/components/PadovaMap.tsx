import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HousingListing, Language } from '../types';
import { UNIPD_LANDMARKS, resolveListingCoords } from '../data/mockData';
import { landmarkLabel } from '../utils/landmarkText';
import { TRANSLATIONS } from '../utils/translations';
import { getLocalizedListing } from '../utils/listingTranslator';
import { 
  Maximize2, 
  Minimize2, 
  MapPin, 
  Navigation, 
  Building2, 
  Eye, 
  ExternalLink,
  Train,
  X
} from 'lucide-react';

// Nokta ikonları Leaflet'in HTML string işaretlerinde kullanıldığı için lucide yollarının SVG karşılıkları.
const LANDMARK_ICON_SHAPES: Record<string, string> = {
  Building2:
    '<path d="M10 12h4"/><path d="M10 8h4"/><path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>',
  Stethoscope:
    '<path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/>',
  Cpu:
    '<path d="M12 20v2"/><path d="M12 2v2"/><path d="M17 20v2"/><path d="M17 2v2"/><path d="M2 12h2"/><path d="M2 17h2"/><path d="M2 7h2"/><path d="M20 12h2"/><path d="M20 17h2"/><path d="M20 7h2"/><path d="M7 20v2"/><path d="M7 2v2"/><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/>',
  BookOpen:
    '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  Train:
    '<rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h.01"/><path d="M16 15h.01"/>',
  Landmark:
    '<path d="M10 18v-7"/><path d="M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M3 22h18"/><path d="M6 18v-7"/>',
};

const landmarkIconSvg = (name: string): string => {
  const shapes = LANDMARK_ICON_SHAPES[name];
  if (!shapes) return '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0">${shapes}</svg>`;
};

interface PadovaMapProps {
  listings: HousingListing[];
  selectedListing?: HousingListing | null;
  onOpenDetailPage: (listing: HousingListing) => void;
  onOpenPreviewModal: (listing: HousingListing) => void;
  currentLang?: Language;
  height?: string;
}

export const PadovaMap: React.FC<PadovaMapProps> = ({
  listings,
  selectedListing,
  onOpenDetailPage,
  onOpenPreviewModal,
  currentLang = 'tr',
  height = '480px',
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.tr;
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const landmarksLayerRef = useRef<L.LayerGroup | null>(null);

  const [showLandmarks, setShowLandmarks] = useState(true);
  const [activePopupListing, setActivePopupListing] = useState<HousingListing | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Default Padova Coordinates
  const PADOVA_CENTER: [number, number] = [45.4064, 11.8768];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: selectedListing?.lat && selectedListing?.lng 
          ? [selectedListing.lat, selectedListing.lng] 
          : PADOVA_CENTER,
        zoom: selectedListing ? 15 : 13,
        zoomControl: false,
      });

      // OpenStreetMap pure tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add Zoom Control to Top-Right
      L.control.zoom({ position: 'topright' }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      const landmarksGroup = L.layerGroup().addTo(map);

      markersLayerRef.current = markersGroup;
      landmarksLayerRef.current = landmarksGroup;
      mapInstanceRef.current = map;
    }

    const timers = [50, 150, 300, 500].map(delay =>
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, delay)
    );

    const handleResize = () => {
      mapInstanceRef.current?.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Update Markers when listings or selectedListing changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();
    map.invalidateSize();

    const listingsToDisplay = selectedListing ? [selectedListing] : listings;
    const bounds = L.latLngBounds([]);

    listingsToDisplay.forEach((listing, index) => {
      const [lat, lng] = resolveListingCoords(listing, index);
      bounds.extend([lat, lng]);

      const isSelected = selectedListing?.id === listing.id;

      // Custom Modern Marker Icon with reliable inline styles
      const markerHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none;">
          <div style="background: ${isSelected ? '#ea580c' : '#ffffff'}; color: ${isSelected ? '#ffffff' : '#1c1917'}; border: 1.5px solid ${isSelected ? '#c2410c' : '#e7e5e4'}; padding: 3px 8px; font-weight: 700; font-size: 11px; white-space: nowrap; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1); border-radius: 9999px; display: flex; align-items: center; gap: 4px; transition: transform 0.15s ease;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span>€${listing.price}</span>
          </div>
          <div style="width: 6px; height: 6px; background: ${isSelected ? '#ea580c' : '#ffffff'}; border-right: 1.5px solid ${isSelected ? '#c2410c' : '#e7e5e4'}; border-bottom: 1.5px solid ${isSelected ? '#c2410c' : '#e7e5e4'}; transform: rotate(45deg); margin-top: -3.5px;"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: markerHtml,
        iconSize: [80, 36],
        iconAnchor: [40, 34],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on('click', () => {
        setActivePopupListing(listing);
        map.setView([lat, lng], Math.max(map.getZoom(), 15), {
          animate: true,
        });
      });

      markersGroup.addLayer(marker);
    });

    // If single listing selected, center and zoom in
    if (selectedListing) {
      const [selLat, selLng] = resolveListingCoords(selectedListing, 0);
      map.setView([selLat, selLng], 15, { animate: true });
    } else if (bounds.isValid() && listingsToDisplay.length > 0) {
      // Auto frame all listings so every single listing is visible on the map!
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [listings, selectedListing]);

  // Update Landmarks (UniPD Campuses & Transport)
  useEffect(() => {
    const landmarksGroup = landmarksLayerRef.current;
    if (!landmarksGroup) return;

    landmarksGroup.clearLayers();

    if (showLandmarks && !selectedListing) {
      UNIPD_LANDMARKS.forEach((lm) => {
        const landmarkHtml = `
          <div class="cursor-pointer transform -translate-x-1/2 -translate-y-full hover:scale-110 transition">
            <div class="flex items-center gap-1.5 bg-stone-900 text-amber-300 border border-amber-400/80 px-2.5 py-1 rounded-full shadow-md text-[10px] font-semibold whitespace-nowrap">
              ${landmarkIconSvg(lm.icon)}
              <span class="max-w-[120px] truncate">${landmarkLabel(lm.name, lm.type, currentLang).name}</span>
            </div>
            <div class="w-2 h-2 bg-stone-900 rotate-45 mx-auto -mt-1 border-r border-b border-amber-400/80"></div>
          </div>
        `;

        const icon = L.divIcon({
          className: 'custom-landmark-pin',
          html: landmarkHtml,
          iconSize: [80, 26],
          iconAnchor: [40, 26],
        });

        const landmarkMarker = L.marker([lm.lat, lm.lng], { icon });
        landmarkMarker.bindPopup(`
          <div class="text-xs p-1 space-y-1">
            <strong class="text-stone-900 block font-bold">${landmarkLabel(lm.name, lm.type, currentLang).name}</strong>
            <span class="text-stone-500 block text-[10px]">${landmarkLabel(lm.name, lm.type, currentLang).type}</span>
          </div>
        `);
        landmarksGroup.addLayer(landmarkMarker);
      });
    }
  }, [showLandmarks, selectedListing, currentLang]);

  const handleCenterPadova = () => {
    mapInstanceRef.current?.setView(PADOVA_CENTER, 13, { animate: true });
    setActivePopupListing(null);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 250);
  };

  return (
    <div 
      id="padova-map-wrapper"
      className={`bg-white rounded-2xl border border-stone-200 overflow-hidden flex flex-col transition-all duration-300 ${
        isExpanded 
          ? 'fixed inset-3 md:inset-6 z-50 shadow-2xl' 
          : 'relative w-full shadow-xs'
      }`}
      style={{ height: isExpanded ? 'calc(100vh - 32px)' : height }}
    >
      {/* Map Control Header Bar */}
      <div className="bg-stone-900 text-white px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-md">
            {t.livePadovaMap}
          </span>
          <span className="text-[11px] bg-stone-800 text-stone-200 border border-stone-700 px-2.5 py-0.5 rounded-md font-medium flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-orange-400" /> 
            {selectedListing ? selectedListing.streetAddress : `${listings.length} ${t.listingsOnMap}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {!selectedListing && (
            <button
              onClick={() => setShowLandmarks(!showLandmarks)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1 cursor-pointer transition ${
                showLandmarks 
                  ? 'bg-amber-400/90 text-stone-950 border-amber-300' 
                  : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
              }`}
              title="UniPD"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{t.unipdCampuses}</span>
            </button>
          )}

          <button
            onClick={handleCenterPadova}
            className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-[11px] font-medium rounded-lg flex items-center gap-1 cursor-pointer transition"
            title={t.mapCenter}
          >
            <Navigation className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden sm:inline">{t.mapCenter}</span>
          </button>

          <button
            onClick={toggleExpand}
            className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg border border-stone-700 cursor-pointer transition"
            title={isExpanded ? t.shrinkMap : t.expandMap}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Map Interactive Canvas */}
      <div className="relative flex-1 w-full bg-stone-100">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Interactive Popup Card when a pin is selected */}
        {activePopupListing && (() => {
          const localizedPopupListing = getLocalizedListing(activePopupListing, currentLang);
          return (
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm z-30 bg-white border border-stone-200 p-3.5 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="bg-orange-50 text-orange-700 border border-orange-200 text-[9px] font-semibold px-2 py-0.5 rounded-full">
                    {localizedPopupListing.roomType}
                  </span>
                  <span className="text-[11px] text-stone-500 font-medium truncate">
                    {localizedPopupListing.district}
                  </span>
                </div>
                <button 
                  onClick={() => setActivePopupListing(null)}
                  className="text-stone-400 hover:text-stone-700 font-bold text-xs p-1 transition"
                  aria-label={t.closeBtn}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex gap-3 mb-3">
                <img 
                  src={localizedPopupListing.images[0]} 
                  alt="" 
                  className="w-16 h-16 object-cover rounded-xl border border-stone-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 
                    onClick={() => onOpenDetailPage(activePopupListing)}
                    className="font-bold text-xs text-stone-900 leading-snug line-clamp-2 hover:text-orange-600 cursor-pointer transition"
                  >
                    {localizedPopupListing.title}
                  </h4>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-base font-bold text-stone-900">€{localizedPopupListing.price}</span>
                    <span className="text-[10px] text-stone-400">{localizedPopupListing.expenses}</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium truncate mt-0.5">
                    {localizedPopupListing.distanceToFaculty}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                <button
                  onClick={() => onOpenPreviewModal(activePopupListing)}
                  className="border border-stone-200 bg-stone-50 hover:bg-stone-100 py-2 px-2 text-[11px] font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition text-stone-700"
                >
                  <Eye className="w-3.5 h-3.5 text-stone-500" />
                  <span>{t.quickPreview}</span>
                </button>
                <button
                  onClick={() => onOpenDetailPage(activePopupListing)}
                  className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-2 text-[11px] font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs"
                >
                  <span>{t.viewListing}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })()}

        {/* Map Legend Bar */}
        <div className="absolute top-2 left-2 z-20 bg-white/95 backdrop-blur-xs border border-stone-200 px-3 py-1.5 text-[11px] font-medium rounded-xl shadow-xs flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-orange-600 rounded-full"></span>
            <span className="text-stone-700">{t.studentRoomLegend}</span>
          </div>
          <div className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-stone-600" />
            <span className="text-stone-700">{t.unipdCampuses}</span>
          </div>
          <div className="flex items-center gap-1">
            <Train className="w-3.5 h-3.5 text-stone-600" />
            <span className="text-stone-700">{t.stationTram}</span>
          </div>
        </div>

      </div>

      {/* Bottom Info Status */}
      <div className="bg-stone-50 px-3 py-2 border-t border-stone-200 text-[11px] text-stone-500 flex flex-wrap items-center justify-between gap-1.5">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-orange-600" />
          <span>{t.realCoordinates}</span>
        </span>
        <span className="text-[10px] text-stone-400 font-medium">
          {t.openStreetMapLayer}
        </span>
      </div>
    </div>
  );
};
