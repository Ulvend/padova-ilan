import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, ShieldCheck, Video, Building2, Send, Calendar, Clock, Users, Flame, Wind, Wifi, Bike, Car, Cigarette, Dog, Sparkles, UserPlus, LogIn, Lock, MapPin, Loader2, Check } from 'lucide-react';
import { HousingListing, RoomType, ContractType, DistrictArea, Language, UserProfile } from '../types';
import { DISTRICT_COORDINATES_MAP, resolveListingCoords } from '../data/mockData';
import { TRANSLATIONS } from '../utils/translations';
import { 
  geocodeAddress, 
  searchAddressSuggestions, 
  reverseGeocode, 
  calculateNearestFaculty, 
  AddressSuggestion 
} from '../services/geocodingService';
import { MiniLocationPicker } from './MiniLocationPicker';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddListing?: (listing: HousingListing) => void;
  onSubmitListing?: (listing: HousingListing) => void;
  currentLang?: Language;
  currentUser?: UserProfile;
  isLoggedIn?: boolean;
  onOpenAuthModal?: (mode?: 'login' | 'register' | 'forgot', reason?: any) => void;
}

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  isOpen,
  onClose,
  onAddListing,
  onSubmitListing,
  currentLang = 'tr',
  currentUser,
  isLoggedIn = false,
  onOpenAuthModal,
}) => {
  if (!isOpen) return null;

  const effectiveIsLoggedIn =
    isLoggedIn ||
    Boolean(
      currentUser &&
      currentUser.id &&
      currentUser.id !== 'guest' &&
      currentUser.id !== 'student_guest' &&
      (currentUser.email || currentUser.username !== 'guest')
    );

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.tr;
  const [title, setTitle] = useState('');
  const [district, setDistrict] = useState<DistrictArea>('Policlinico / Tıp Fakültesi (< 500m)');
  const [streetAddress, setStreetAddress] = useState('');
  const [distanceToFaculty, setDistanceToFaculty] = useState('Fakülteye 5 dk yürüme');
  const [price, setPrice] = useState('420');
  const [expenses, setExpenses] = useState('+€40 Giderler');
  const [roomType, setRoomType] = useState<RoomType>('Singola');
  const [contractType, setContractType] = useState<ContractType>('Contratto per Studenti (Canone Concordato)');
  const [contractStartDate, setContractStartDate] = useState('2026-10-01');
  const [isImmediate, setIsImmediate] = useState(false);
  const [contractDuration, setContractDuration] = useState('12 Ay (Akademik Yıl)');
  const [hasVideoTour, setHasVideoTour] = useState(true);
  const [roomM2, setRoomM2] = useState('15');
  const [apartmentM2, setApartmentM2] = useState('95');
  const [bathrooms, setBathrooms] = useState('2');
  const [description, setDescription] = useState('');
  const [flatmateName, setFlatmateName] = useState('Matteo');
  const [flatmateFaculty, setFlatmateFaculty] = useState('UniPD Mühendislik');

  // Real Geocoding States
  const [lat, setLat] = useState<number>(() => DISTRICT_COORDINATES_MAP['Policlinico / Tıp Fakültesi (< 500m)'][0]);
  const [lng, setLng] = useState<number>(() => DISTRICT_COORDINATES_MAP['Policlinico / Tıp Fakültesi (< 500m)'][1]);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [nearestFacultyText, setNearestFacultyText] = useState<string>('');
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Compute nearest faculty whenever lat/lng updates
  useEffect(() => {
    if (lat && lng) {
      const nearest = calculateNearestFaculty(lat, lng, currentLang);
      setNearestFacultyText(nearest.formattedText);
      setDistanceToFaculty(nearest.formattedText);
    }
  }, [lat, lng, currentLang]);

  // When district changes, if no specific address typed, update coords to district center
  const handleDistrictChange = (newDistrict: DistrictArea) => {
    setDistrict(newDistrict);
    if (!streetAddress.trim() && DISTRICT_COORDINATES_MAP[newDistrict]) {
      const [dLat, dLng] = DISTRICT_COORDINATES_MAP[newDistrict];
      setLat(dLat);
      setLng(dLng);
    }
  };

  // Real-time Address autocomplete search with OpenStreetMap Nominatim
  const handleAddressChange = (value: string) => {
    setStreetAddress(value);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (value.trim().length >= 3) {
      searchDebounceRef.current = setTimeout(async () => {
        setIsGeocoding(true);
        const results = await searchAddressSuggestions(value);
        setAddressSuggestions(results);
        setShowSuggestions(results.length > 0);
        setIsGeocoding(false);
      }, 400);
    } else {
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setStreetAddress(suggestion.streetName);
    setLat(suggestion.lat);
    setLng(suggestion.lng);
    setShowSuggestions(false);
    const faculty = calculateNearestFaculty(suggestion.lat, suggestion.lng, currentLang);
    setNearestFacultyText(faculty.formattedText);
    setDistanceToFaculty(faculty.formattedText);
  };

  const handleAddressBlur = () => {
    setTimeout(async () => {
      setShowSuggestions(false);
      if (streetAddress.trim().length >= 3) {
        setIsGeocoding(true);
        const result = await geocodeAddress(streetAddress, district);
        if (result && result.lat && result.lng) {
          setLat(result.lat);
          setLng(result.lng);
        }
        setIsGeocoding(false);
      }
    }, 250);
  };

  // Interactive Mini-Map pin click or drag
  const handleLocationPickerChange = async (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    const faculty = calculateNearestFaculty(newLat, newLng, currentLang);
    setNearestFacultyText(faculty.formattedText);
    setDistanceToFaculty(faculty.formattedText);

    // Reverse geocode to refine street name if user just clicked without typing
    const reverse = await reverseGeocode(newLat, newLng);
    if (reverse && reverse.streetAddress && (!streetAddress.trim() || streetAddress.includes('Via Belzoni'))) {
      setStreetAddress(reverse.streetAddress);
    }
  };

  // Roommate & Flat Profile States
  const [totalHousemates, setTotalHousemates] = useState('3');
  const [genderPreference, setGenderPreference] = useState<'female_only' | 'male_only' | 'any'>('any');
  const [genderDistribution, setGenderDistribution] = useState('2 Erkek, 1 Kız (Karma)');
  const [occupantType, setOccupantType] = useState<'students_only' | 'workers_only' | 'mixed'>('students_only');
  const [smokingAllowed, setSmokingAllowed] = useState(false);
  const [petsAllowed, setPetsAllowed] = useState(false);

  // Critical Amenities States
  const [heatingType, setHeatingType] = useState<'autonomo' | 'centralizzato'>('autonomo');
  const [hasAirConditioning, setHasAirConditioning] = useState(true);
  const [hasWashingMachine, setHasWashingMachine] = useState(true);
  const [hasWifi, setHasWifi] = useState(true);
  const [hasBikeParking, setHasBikeParking] = useState(true);
  const [bikeParkingDetails, setBikeParkingDetails] = useState('Bina içi / Avlu güvenli bisiklet park alanı');
  const [hasParking, setHasParking] = useState(false);
  const [parkingDetails, setParkingDetails] = useState('Sokak park izni / Mavi çizgi');

  const formatDisplayStartDate = (dateStr: string, immediate: boolean) => {
    if (immediate) return t.contractStartImmediate;
    if (!dateStr) return t.contractStartImmediate;
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const monthsTr = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const monthsIt = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
        const monthsDe = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
        
        const monthNames = currentLang === 'it' ? monthsIt : currentLang === 'en' ? monthsEn : currentLang === 'de' ? monthsDe : monthsTr;
        return `${day} ${monthNames[monthIndex] || parts[1]} ${year}`;
      }
    } catch (e) {}
    return dateStr;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      let finalLat = lat;
      let finalLng = lng;

      // Ensure valid coordinates through real geocoding if needed
      if (!finalLat || !finalLng || isNaN(finalLat) || isNaN(finalLng)) {
        const addressToGeocode = streetAddress.trim() || district;
        const geo = await geocodeAddress(addressToGeocode, district);
        if (geo && geo.lat && geo.lng) {
          finalLat = geo.lat;
          finalLng = geo.lng;
        } else {
          const [dLat, dLng] = resolveListingCoords({ district, streetAddress });
          finalLat = dLat;
          finalLng = dLng;
        }
      }

      const address = streetAddress.trim() || 'Via Belzoni, Padova';
      const formattedStartDate = formatDisplayStartDate(contractStartDate, isImmediate);

      const newListing: HousingListing = {
        id: `PD-${Date.now().toString().slice(-4)}`,
        title: title.trim(),
        district,
        streetAddress: address,
        lat: finalLat,
        lng: finalLng,
        distanceToFaculty: distanceToFaculty || nearestFacultyText || 'Fakülteye yakın',
        price: Number(price) || 400,
        expenses,
        fairPriceStatus: Number(price) <= 435 ? 'lower' : 'higher',
        fairPriceText: Number(price) <= 435 ? 'Rayiç Ortalamasında / Uygun' : 'Rayiç Üstü Bildirimi',
        roomType,
        contractType,
        contractStartDate: formattedStartDate,
        contractDuration,
        hasVideoTour,
        videoTitle: hasVideoTour ? '360° Oda ve Ortak Alan Canlı Turu' : undefined,
        isStudentCardVerified: true,
        compatibilityScore: 92,
        compatibilityReason: 'UniPD Öğrenci Topluluğu',
        currentFlatmates: [
          {
            name: flatmateName || 'Ev Arkadaşı',
            age: 22,
            faculty: flatmateFaculty || 'UniPD',
            traits: 'Düzenli, Sessiz Saatler',
            icon: 'grad',
          },
        ],
      totalHousemates: Number(totalHousemates) || 3,
      genderPreference,
      genderDistribution: genderDistribution.trim() || 'Karma Ev',
      occupantType,
      smokingAllowed,
      petsAllowed,
      heatingType,
      hasAirConditioning,
      hasWashingMachine,
      hasWifi,
      hasBikeParking,
      bikeParkingDetails: hasBikeParking ? bikeParkingDetails.trim() : undefined,
      hasParking,
      parkingDetails: hasParking ? parkingDetails.trim() : undefined,
      roomM2: Number(roomM2) || 14,
      apartmentM2: Number(apartmentM2) || 90,
      bathrooms: Number(bathrooms) || 1,
      confirmationTimeLeft: '3 Gün Teyitli: 72s Kaldı',
      description: description.trim() || 'Padova Üniversitesi öğrencileri için uygun, temiz ve resmi sözleşmeli oda.',
      userId: currentUser?.id,
      poster: {
        id: currentUser?.id,
        username: currentUser?.username || 'ogrenci',
        name: currentUser?.name || 'UniPD Öğrencisi',
        avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
        verifiedUniPD: currentUser?.studentIdVerified ?? true,
        department: currentUser?.faculty || 'UniPD',
        phone: currentUser?.phone || '+39 340 000 0000',
      },
      images: [
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      ],
      createdAt: 'Şimdi',
      views: 1,
      isMyListing: true,
    };

      const addFn = onAddListing || onSubmitListing;
      if (addFn) {
        addFn(newListing);
      }
      onClose();
    } catch (err) {
      console.error('Failed to submit listing:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!effectiveIsLoggedIn) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
        <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 overflow-hidden my-auto shadow-2xl animate-in fade-in zoom-in-95">
          {/* Modal Header */}
          <div className="bg-stone-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-stone-800">
            <div className="flex items-center gap-2">
              <span className="bg-orange-600 px-2.5 py-0.5 font-bold uppercase text-[10px] rounded-full">UniPD Housing</span>
              <h3 className="font-bold text-sm">
                {currentLang === 'tr' ? 'Kayıt Olmanız Gerekiyor' :
                 currentLang === 'it' ? 'Registrazione Richiesta' :
                 currentLang === 'de' ? 'Registrierung erforderlich' :
                 currentLang === 'ru' ? 'Требуется регистрация' :
                 currentLang === 'hi' ? 'पंजीकरण आवश्यक है' :
                 'Registration Required'}
              </h3>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-stone-800 text-stone-300 hover:text-white rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto shadow-sm">
              <UserPlus className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-lg font-bold text-stone-900">
                {currentLang === 'tr' ? 'İlan Oluşturmak İçin Kayıt Olmalısınız' :
                 currentLang === 'it' ? 'Registrazione Richiesta per Pubblicare' :
                 currentLang === 'de' ? 'Registrierung erforderlich zum Inserieren' :
                 currentLang === 'ru' ? 'Для публикации требуется регистрация' :
                 currentLang === 'hi' ? 'विज्ञापन पोस्ट करने के लिए पंजीकरण आवश्यक है' :
                 'Registration Required to Post a Listing'}
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed max-w-xs mx-auto">
                {currentLang === 'tr' ? 'Padova güvenli öğrenci konaklama ağında yeni bir ev veya oda ilanı oluşturabilmek için lütfen kayıt olun ya da mevcut hesabınıza giriş yapın.' :
                 currentLang === 'it' ? 'Per pubblicare una stanza o un alloggio nella rete per studenti di Padova, registrati o accedi con il tuo account.' :
                 currentLang === 'de' ? 'Um ein Zimmer oder eine Wohnung im Paduaner Studentennetzwerk anzubieten, registrieren Sie sich bitte oder melden Sie sich an.' :
                 currentLang === 'ru' ? 'Чтобы опубликовать объявление в сети студентов Падуи, пожалуйста, зарегистрируйтесь или войдите в систему.' :
                 currentLang === 'hi' ? 'पदुवा छात्र नेटवर्क में कमरा या आवास सूची पोस्ट करने के लिए, कृपया पंजीकरण करें या लॉगिन करें।' :
                 'To post a room or housing listing in the Padova student network, please register or log in to your account.'}
              </p>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenAuthModal) onOpenAuthModal('register', 'createListing');
                }}
                className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t.registerNav}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenAuthModal) onOpenAuthModal('login', 'createListing');
                }}
                className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-stone-500" />
                <span>{t.loginNav}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-stone-200 overflow-hidden my-auto max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="bg-stone-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="bg-orange-600 px-2.5 py-0.5 font-bold uppercase text-[10px] rounded-full">{t.postAdBtn}</span>
            <h3 className="font-bold text-sm">{t.newListingHeader}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-stone-800 text-stone-300 hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1 text-xs">
          
          <div>
            <label className="font-semibold text-stone-700 block mb-1.5 uppercase text-[11px] tracking-wide">{t.listingTitleLabel} *</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Via Forcellini - Singola..." 
              className="w-full border border-stone-200 rounded-xl p-3 bg-stone-50/50 outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-semibold text-stone-700 block mb-1.5 uppercase text-[11px] tracking-wide">{t.districtLabel}</label>
              <select 
                value={district}
                onChange={(e) => handleDistrictChange(e.target.value as DistrictArea)}
                className="w-full border border-stone-200 rounded-xl p-3 bg-stone-50/50 outline-none focus:bg-white focus:border-orange-500 transition min-h-[44px]"
              >
                <option value="Policlinico / Tıp Fakültesi (< 500m)">{t.districtPoliclinico}</option>
                <option value="Portello / Mühendislik & Fen (< 500m)">{t.districtPortello}</option>
                <option value="Beato Pellegrino / Beşeri Bilimler">{t.districtBeato}</option>
                <option value="Centro Storico / Prato della Valle">{t.districtCentro}</option>
                <option value="Forcellini">{t.districtForcellini}</option>
                <option value="Arcella">{t.districtArcella}</option>
              </select>
            </div>

            <div className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-stone-700 uppercase text-[11px] tracking-wide">{t.streetAddressLabel}</label>
                {isGeocoding && (
                  <span className="flex items-center gap-1 text-[10px] text-orange-600 font-semibold">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>OSM Geocoding...</span>
                  </span>
                )}
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  value={streetAddress}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  onBlur={handleAddressBlur}
                  onFocus={() => {
                    if (addressSuggestions.length > 0) setShowSuggestions(true);
                  }}
                  placeholder="Via Forcellini 42, Padova" 
                  className="w-full border border-stone-200 rounded-xl p-3 bg-stone-50/50 outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition min-h-[44px] pr-9"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                  <MapPin className="w-4 h-4 text-orange-600" />
                </div>
              </div>

              {/* Real Autocomplete Dropdown suggestions from OpenStreetMap Nominatim */}
              {showSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-[600] bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                  <div className="px-3 py-1.5 bg-stone-50 border-b border-stone-100 text-[10px] font-semibold text-stone-500 flex items-center justify-between">
                    <span>OpenStreetMap Önerileri</span>
                    <span className="font-mono text-[9px] text-stone-400">Padova</span>
                  </div>
                  {addressSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSuggestion(s);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-orange-50/70 border-b border-stone-100 last:border-b-0 transition flex items-start gap-2 text-xs cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-stone-800 truncate">{s.streetName}</p>
                        <p className="text-[10px] text-stone-500 truncate">{s.displayName}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Interactive Mini-Map Pinpoint & Real Geocoding verification */}
          <div className="bg-stone-50/60 p-3.5 rounded-2xl border border-stone-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-stone-700 uppercase text-[11px] tracking-wide flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-600" />
                <span>Harita Konum Doğrulaması & İğne Belirleme</span>
              </span>
              <span className="text-[10px] text-stone-500 bg-white px-2 py-0.5 rounded border border-stone-200">
                Canlı OpenStreetMap
              </span>
            </div>
            <MiniLocationPicker
              lat={lat}
              lng={lng}
              onLocationChange={handleLocationPickerChange}
              address={streetAddress || district}
              isGeocoding={isGeocoding}
              nearestFacultyText={nearestFacultyText}
              currentLang={currentLang}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="font-semibold text-stone-700 block mb-1.5 uppercase text-[11px] tracking-wide">{t.monthlyRentLabel} *</label>
              <input 
                type="number" 
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-stone-200 rounded-xl p-3 bg-stone-50/50 outline-none focus:bg-white focus:border-orange-500 transition font-bold min-h-[44px]"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1.5 uppercase text-[11px] tracking-wide">{t.expensesBillsLabel}</label>
              <input 
                type="text" 
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                placeholder="+€40 / Inc." 
                className="w-full border border-stone-200 rounded-xl p-3 bg-stone-50/50 outline-none focus:bg-white focus:border-orange-500 transition min-h-[44px]"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1.5 uppercase text-[11px] tracking-wide">{t.roomTypeLabel}</label>
              <select 
                value={roomType}
                onChange={(e) => setRoomType(e.target.value as RoomType)}
                className="w-full border border-stone-200 rounded-xl p-3 bg-stone-50/50 outline-none focus:bg-white focus:border-orange-500 transition min-h-[44px]"
              >
                <option value="Singola">{t.roomSingola}</option>
                <option value="Doppia">{t.roomDoppia}</option>
                <option value="Posto Letto">{t.roomPostoLetto}</option>
                <option value="Monolocale">{t.roomMonolocale}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1.5 uppercase text-[11px] tracking-wide">{t.contractTypeLabel}</label>
            <select 
              value={contractType}
              onChange={(e) => setContractType(e.target.value as ContractType)}
              className="w-full border border-stone-200 rounded-xl p-3 bg-stone-50/50 outline-none focus:bg-white focus:border-orange-500 transition min-h-[44px]"
            >
              <option value="Contratto per Studenti (Canone Concordato)">
                {t.contractCanone}
              </option>
              <option value="Subentro (Resmi Sözleşme Devri)">
                {t.contractSubentro}
              </option>
              <option value="Contratto Transitorio (1-18 Ay)">
                {t.contractTransitorio}
              </option>
              <option value="Standart 4+4 / 3+2 Yıllık">
                {t.contractStandard}
              </option>
            </select>
          </div>

          {/* Kontrat Başlangıç Tarihi ve Süresi */}
          <div className="p-4 bg-orange-50/60 border border-orange-200/80 rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-orange-950 flex items-center gap-1.5 uppercase text-[11px] tracking-wide">
                <Calendar className="w-4 h-4 text-orange-600" />
                <span>{t.contractStartDateLabel} *</span>
              </label>
              <span className="text-[11px] text-orange-900 font-bold bg-orange-100/90 border border-orange-200/80 px-2.5 py-0.5 rounded-full shadow-2xs">
                {isImmediate ? t.contractStartImmediate : formatDisplayStartDate(contractStartDate, false)}
              </span>
            </div>

            {/* Hızlı Dönem Seçim Butonları */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setIsImmediate(true)}
                className={`py-2 px-2.5 rounded-xl font-bold text-xs transition border cursor-pointer flex items-center justify-center gap-1.5 ${
                  isImmediate
                    ? 'bg-orange-600 text-white border-orange-600 shadow-xs ring-2 ring-orange-400/40'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <span>⚡</span>
                <span className="truncate">{t.contractStartImmediate.split(' ')[0]}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsImmediate(false);
                  setContractStartDate('2026-10-01');
                }}
                className={`py-2 px-2.5 rounded-xl font-bold text-xs transition border cursor-pointer flex items-center justify-center gap-1.5 ${
                  !isImmediate && contractStartDate === '2026-10-01'
                    ? 'bg-orange-600 text-white border-orange-600 shadow-xs ring-2 ring-orange-400/40'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <span>🎓</span>
                <span className="truncate">1 Ekim 2026</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsImmediate(false);
                  setContractStartDate('2026-11-01');
                }}
                className={`py-2 px-2.5 rounded-xl font-bold text-xs transition border cursor-pointer flex items-center justify-center gap-1.5 ${
                  !isImmediate && contractStartDate === '2026-11-01'
                    ? 'bg-orange-600 text-white border-orange-600 shadow-xs ring-2 ring-orange-400/40'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <span>🍂</span>
                <span className="truncate">1 Kasım 2026</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsImmediate(false);
                  setContractStartDate('2027-02-01');
                }}
                className={`py-2 px-2.5 rounded-xl font-bold text-xs transition border cursor-pointer flex items-center justify-center gap-1.5 ${
                  !isImmediate && contractStartDate === '2027-02-01'
                    ? 'bg-orange-600 text-white border-orange-600 shadow-xs ring-2 ring-orange-400/40'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <span>🌸</span>
                <span className="truncate">1 Şubat 2027</span>
              </button>
            </div>

            {/* Özel Tarih Seçici ve Sözleşme Süresi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] text-stone-600 block mb-1 font-semibold uppercase">
                  {currentLang === 'tr' ? 'Takvimden Tarih Seç:' : 'Pick Calendar Date:'}
                </label>
                <input
                  type="date"
                  value={isImmediate ? '' : contractStartDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setContractStartDate(e.target.value);
                      setIsImmediate(false);
                    }
                  }}
                  min="2026-09-01"
                  className="w-full border border-stone-200 bg-white rounded-xl p-2.5 text-xs text-stone-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition min-h-[42px]"
                />
              </div>

              <div>
                <label className="text-[10px] text-stone-600 block mb-1 font-semibold uppercase">
                  {t.contractDurationLabel}:
                </label>
                <select
                  value={contractDuration}
                  onChange={(e) => setContractDuration(e.target.value)}
                  className="w-full border border-stone-200 bg-white rounded-xl p-2.5 text-xs text-stone-900 outline-none focus:border-orange-500 transition min-h-[42px]"
                >
                  <option value="12 Ay (Akademik Yıl)">12 Ay (Akademik Yıl 2026-2027)</option>
                  <option value="6 Ay (Tek Dönem)">6 Ay (Tek Dönem)</option>
                  <option value="1 - 18 Ay (Transitorio)">1 - 18 Ay (Geçici Transitorio)</option>
                  <option value="Standart 3+2 / 4+4 Yıl">Standart 3+2 / 4+4 Yıl</option>
                </select>
              </div>
            </div>
            <p className="text-[10px] text-stone-500 leading-tight">
              *UniPD öğrencileri için kontrat başlangıçları çoğunlukla 1 Ekim (Güz Dönemi) veya 1 Şubat (Bahar Dönemi) olarak düzenlenir.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="font-semibold text-stone-700 block mb-1.5 uppercase text-[11px] tracking-wide">{t.roomArea}</label>
              <input 
                type="number" 
                value={roomM2}
                onChange={(e) => setRoomM2(e.target.value)}
                className="w-full border border-stone-200 rounded-xl p-3 bg-stone-50/50 outline-none focus:bg-white focus:border-orange-500 transition min-h-[44px]"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1.5 uppercase text-[11px] tracking-wide">{t.apartmentArea}</label>
              <input 
                type="number" 
                value={apartmentM2}
                onChange={(e) => setApartmentM2(e.target.value)}
                className="w-full border border-stone-200 rounded-xl p-3 bg-stone-50/50 outline-none focus:bg-white focus:border-orange-500 transition min-h-[44px]"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1.5 uppercase text-[11px] tracking-wide">{t.bathroomsCount}</label>
              <input 
                type="number" 
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="w-full border border-stone-200 rounded-xl p-3 bg-stone-50/50 outline-none focus:bg-white focus:border-orange-500 transition min-h-[44px]"
              />
            </div>
          </div>

          {/* ODA ARKADAŞI & EV PROFİLİ */}
          <div className="p-4 bg-amber-50/50 border border-amber-200/70 rounded-2xl space-y-3.5">
            <div className="flex items-center gap-2 border-b border-amber-200/60 pb-2">
              <Users className="w-4 h-4 text-amber-700" />
              <h4 className="font-bold text-xs uppercase tracking-wide text-amber-950">
                {t.roommateProfileTitle}
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Evde Kaç Kişi Kalıyor */}
              <div>
                <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                  {t.totalOccupants}
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={totalHousemates}
                  onChange={(e) => setTotalHousemates(e.target.value)}
                  className="w-full border border-stone-200 bg-white rounded-xl p-2.5 text-xs text-stone-900 outline-none focus:border-amber-500 transition min-h-[40px]"
                />
              </div>

              {/* Cinsiyet Tercihi */}
              <div>
                <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                  {t.genderPrefLabel}
                </label>
                <select
                  value={genderPreference}
                  onChange={(e) => setGenderPreference(e.target.value as 'female_only' | 'male_only' | 'any')}
                  className="w-full border border-stone-200 bg-white rounded-xl p-2.5 text-xs text-stone-900 outline-none focus:border-amber-500 transition min-h-[40px]"
                >
                  <option value="any">{t.genderAny}</option>
                  <option value="female_only">{t.genderFemaleOnly}</option>
                  <option value="male_only">{t.genderMaleOnly}</option>
                </select>
              </div>

              {/* Cinsiyet Dağılımı */}
              <div>
                <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                  {t.genderDistributionLabel}
                </label>
                <input
                  type="text"
                  value={genderDistribution}
                  onChange={(e) => setGenderDistribution(e.target.value)}
                  placeholder="Örn: 2 Kız, 1 Erkek veya Sadece Kızlar"
                  className="w-full border border-stone-200 bg-white rounded-xl p-2.5 text-xs text-stone-900 outline-none focus:border-amber-500 transition min-h-[40px]"
                />
              </div>

              {/* Ev Sakinleri Profili */}
              <div>
                <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                  {t.occupantTypeLabel}
                </label>
                <select
                  value={occupantType}
                  onChange={(e) => setOccupantType(e.target.value as 'students_only' | 'workers_only' | 'mixed')}
                  className="w-full border border-stone-200 bg-white rounded-xl p-2.5 text-xs text-stone-900 outline-none focus:border-amber-500 transition min-h-[40px]"
                >
                  <option value="students_only">{t.occupantsStudentsOnly}</option>
                  <option value="mixed">{t.occupantsMixed}</option>
                  <option value="workers_only">{t.occupantsWorkersOnly}</option>
                </select>
              </div>
            </div>

            {/* Sigara ve Evcil Hayvan Kuralları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 bg-white cursor-pointer hover:bg-stone-50">
                <div className="flex items-center gap-2">
                  <Cigarette className="w-4 h-4 text-stone-500" />
                  <span className="text-xs font-medium text-stone-800">{t.smokingRuleLabel}</span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${smokingAllowed ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 text-stone-700'}`}>
                  {smokingAllowed ? t.smokingAllowed : t.smokingForbidden}
                </span>
                <input
                  type="checkbox"
                  checked={smokingAllowed}
                  onChange={(e) => setSmokingAllowed(e.target.checked)}
                  className="sr-only"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 bg-white cursor-pointer hover:bg-stone-50">
                <div className="flex items-center gap-2">
                  <Dog className="w-4 h-4 text-stone-500" />
                  <span className="text-xs font-medium text-stone-800">{t.petsRuleLabel}</span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${petsAllowed ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-100 text-stone-700'}`}>
                  {petsAllowed ? t.petsAllowed : t.petsForbidden}
                </span>
                <input
                  type="checkbox"
                  checked={petsAllowed}
                  onChange={(e) => setPetsAllowed(e.target.checked)}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          {/* KRİTİK OLANAKLAR, ISITMA & PADOVA ÖZEL DETAYLARI */}
          <div className="p-4 bg-stone-50 border border-stone-200/90 rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <h4 className="font-bold text-xs uppercase tracking-wide text-stone-900">
                  {currentLang === 'tr' ? 'Isıtma, Bisiklet & Donanım Özellikleri' : currentLang === 'it' ? 'Riscaldamento, Posto Bici & Dotazioni' : 'Heating, Bike & Amenities'}
                </h4>
              </div>
            </div>

            {/* Isıtma Tipi */}
            <div>
              <label className="text-[11px] font-semibold text-stone-700 block mb-1 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span>{t.heatingTypeLabel}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setHeatingType('autonomo')}
                  className={`p-2.5 rounded-xl text-xs font-semibold border transition text-left cursor-pointer ${
                    heatingType === 'autonomo'
                      ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-2xs'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <p className="font-bold">{t.heatingAutonomo}</p>
                  <p className="text-[10px] text-stone-500 mt-0.5">Kullanım kadar yakılır</p>
                </button>
                <button
                  type="button"
                  onClick={() => setHeatingType('centralizzato')}
                  className={`p-2.5 rounded-xl text-xs font-semibold border transition text-left cursor-pointer ${
                    heatingType === 'centralizzato'
                      ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-2xs'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <p className="font-bold">{t.heatingCentralizzato}</p>
                  <p className="text-[10px] text-stone-500 mt-0.5">Bina yönetimi kontrolünde</p>
                </button>
              </div>
            </div>

            {/* Donanım Rozetleri / Toggles (Klima, Çamaşır Mak, Wi-Fi) */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setHasAirConditioning(!hasAirConditioning)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  hasAirConditioning ? 'bg-sky-50 border-sky-300 text-sky-900' : 'bg-white border-stone-200 text-stone-400'
                }`}
              >
                <Wind className="w-4 h-4 text-sky-600" />
                <span className="text-[11px] truncate">{t.airConditioningLabel}</span>
              </button>

              <button
                type="button"
                onClick={() => setHasWashingMachine(!hasWashingMachine)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  hasWashingMachine ? 'bg-indigo-50 border-indigo-300 text-indigo-900' : 'bg-white border-stone-200 text-stone-400'
                }`}
              >
                <span className="text-base leading-none">🧺</span>
                <span className="text-[11px] truncate">{t.washingMachineLabel}</span>
              </button>

              <button
                type="button"
                onClick={() => setHasWifi(!hasWifi)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  hasWifi ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-white border-stone-200 text-stone-400'
                }`}
              >
                <Wifi className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] truncate">{t.wifiLabel}</span>
              </button>
            </div>

            {/* Bisiklet Park Yeri (Padova İçin Vazgeçilmez!) */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Bike className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-emerald-950">{t.bikeParkingLabel}</span>
                </div>
                <input
                  type="checkbox"
                  checked={hasBikeParking}
                  onChange={(e) => setHasBikeParking(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
              </label>
              {hasBikeParking && (
                <input
                  type="text"
                  value={bikeParkingDetails}
                  onChange={(e) => setBikeParkingDetails(e.target.value)}
                  placeholder="Bisiklet parkı nerede? (Örn: Kapalı iç avlu, kilitli depo, vb.)"
                  className="w-full border border-emerald-200 bg-white rounded-lg p-2 text-xs text-stone-900 outline-none focus:border-emerald-500"
                />
              )}
            </div>

            {/* Otopark / Garaj */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-700" />
                  <span className="text-xs font-bold text-blue-950">{t.parkingLabel}</span>
                </div>
                <input
                  type="checkbox"
                  checked={hasParking}
                  onChange={(e) => setHasParking(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </label>
              {hasParking && (
                <input
                  type="text"
                  value={parkingDetails}
                  onChange={(e) => setParkingDetails(e.target.value)}
                  placeholder="Otopark detayları (Örn: Kapalı garaj, bina önü rezerve park, sokak park izni)"
                  className="w-full border border-blue-200 bg-white rounded-lg p-2 text-xs text-stone-900 outline-none focus:border-blue-500"
                />
              )}
            </div>
          </div>

          {/* Video Tour Check */}
          <div className="border border-purple-200 p-3.5 rounded-2xl bg-purple-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Video className="w-4 h-4 text-purple-700" />
              <span className="font-semibold text-purple-900">{t.addVideoTourCheck}</span>
            </div>
            <input 
              type="checkbox" 
              checked={hasVideoTour}
              onChange={(e) => setHasVideoTour(e.target.checked)}
              className="w-4 h-4 accent-orange-600 rounded cursor-pointer"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1.5 uppercase text-[11px] tracking-wide">{t.listingDescriptionLabel}</label>
            <textarea 
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="..." 
              className="w-full border border-stone-200 rounded-xl p-3 bg-stone-50/50 outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-3.5 text-xs uppercase tracking-wider font-bold bg-orange-600 hover:bg-orange-700 disabled:bg-stone-400 text-white rounded-xl cursor-pointer shadow-sm active:translate-y-0.5 transition min-h-[44px] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>İlan ve Konum Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{t.publishListingBtn}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
