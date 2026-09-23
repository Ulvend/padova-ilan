import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Plus, 
  ShieldCheck, 
  Video, 
  Building2, 
  Send, 
  Calendar, 
  Clock, 
  Users, 
  Flame, 
  Wind, 
  Wifi, 
  Bike, 
  Car, 
  Cigarette, 
  Dog, 
  Sparkles, 
  UserPlus, 
  LogIn, 
  Lock, 
  MapPin, 
  Loader2, 
  Check,
  Image as ImageIcon,
  Upload,
  Trash2,
  Play,
  Film,
  Star,
  ExternalLink,
  Layers,
  Pencil
} from 'lucide-react';
import { HousingListing, RoomType, ContractType, DistrictArea, Language, UserProfile, VideoAngle } from '../types';
import { DISTRICT_COORDINATES_MAP, resolveListingCoords } from '../data/mockData';
import { TRANSLATIONS } from '../utils/translations';
import { 
  geocodeAddress, 
  searchAddressSuggestions, 
  reverseGeocode, 
  calculateNearestFaculty, 
  AddressSuggestion 
} from '../services/geocodingService';
import { uploadListingPhoto } from '../services/storageService';
import { evaluateFairPrice } from '../utils/fairPrice';

type AngleForm = { room?: string; desk?: string; kitchen?: string; balcony?: string };

// Formdaki açı alanları ↔ VideoTourModal'ın okuduğu videoAngles dizisi
const ANGLE_FIELDS: { key: keyof AngleForm; id: VideoAngle['id']; label: string }[] = [
  { key: 'room', id: 'room', label: 'Oda' },
  { key: 'desk', id: 'desk', label: 'Çalışma Masası' },
  { key: 'kitchen', id: 'kitchen', label: 'Mutfak / Ortak Alan' },
  { key: 'balcony', id: 'view', label: 'Balkon / Manzara' },
];

const anglesToListing = (form: AngleForm): VideoAngle[] | undefined => {
  const angles = ANGLE_FIELDS
    .filter((f) => form[f.key]?.trim())
    .map((f) => ({ id: f.id, label: f.label, videoUrl: form[f.key]!.trim() }));
  return angles.length > 0 ? angles : undefined;
};

const anglesFromListing = (angles: VideoAngle[]): AngleForm =>
  ANGLE_FIELDS.reduce<AngleForm>((acc, f) => {
    const match = angles.find((a) => a.id === f.id);
    if (match) acc[f.key] = match.videoUrl;
    return acc;
  }, {});
import { MiniLocationPicker } from './MiniLocationPicker';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddListing?: (listing: HousingListing) => void | Promise<void>;
  onSubmitListing?: (listing: HousingListing) => void | Promise<void>;
  onUpdateListing?: (listingId: string, updates: Partial<HousingListing>) => void | Promise<void>;
  initialListing?: HousingListing | null;
  isEditMode?: boolean;
  currentLang?: Language;
  currentUser?: UserProfile;
  isLoggedIn?: boolean;
  onOpenAuthModal?: (mode?: 'login' | 'register' | 'forgot', reason?: any) => void;
}

// Hook'lar koşulsuz çağrılsın diye içerik yalnızca modal açıkken mount edilir.
const CreateListingModalContent: React.FC<CreateListingModalProps> = ({
  isOpen,
  onClose,
  onAddListing,
  onSubmitListing,
  onUpdateListing,
  initialListing = null,
  isEditMode = false,
  currentLang = 'tr',
  currentUser,
  isLoggedIn = false,
  onOpenAuthModal,
}) => {
  // Oturum durumu Firebase Auth'tan gelir (AppContext).
  const effectiveIsLoggedIn = isLoggedIn;

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
  // Photos States
  const [images, setImages] = useState<string[]>([]);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video Tour States
  const [hasVideoTour, setHasVideoTour] = useState(false);
  const [videoTourUrl, setVideoTourUrl] = useState('');
  const [showAdvancedVideoAngles, setShowAdvancedVideoAngles] = useState(false);
  const [videoAngles, setVideoAngles] = useState<{
    room?: string;
    desk?: string;
    kitchen?: string;
    balcony?: string;
  }>({});

  const [roomM2, setRoomM2] = useState('15');
  const [apartmentM2, setApartmentM2] = useState('95');
  const [bathrooms, setBathrooms] = useState('2');
  const [description, setDescription] = useState('');
  const [flatmateName, setFlatmateName] = useState('');
  const [flatmateFaculty, setFlatmateFaculty] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Prefill when initialListing is provided (Edit Mode)
  useEffect(() => {
    if (initialListing) {
      setTitle(initialListing.title || '');
      if (initialListing.district) setDistrict(initialListing.district);
      setStreetAddress(initialListing.streetAddress || '');
      setPrice(String(initialListing.price || 420));
      setExpenses(initialListing.expenses || '+€40 Giderler');
      if (initialListing.roomType) setRoomType(initialListing.roomType);
      if (initialListing.contractType) setContractType(initialListing.contractType);
      if (initialListing.roomM2) setRoomM2(String(initialListing.roomM2));
      if (initialListing.apartmentM2) setApartmentM2(String(initialListing.apartmentM2));
      if (initialListing.bathrooms) setBathrooms(String(initialListing.bathrooms));
      setDescription(initialListing.description || '');
      if (initialListing.totalHousemates) setTotalHousemates(String(initialListing.totalHousemates));
      if (initialListing.genderPreference) setGenderPreference(initialListing.genderPreference);
      if (initialListing.femaleCount !== undefined) setFemaleCount(String(initialListing.femaleCount));
      if (initialListing.maleCount !== undefined) setMaleCount(String(initialListing.maleCount));
      if (initialListing.occupantType) setOccupantType(initialListing.occupantType);
      setSmokingAllowed(Boolean(initialListing.smokingAllowed));
      setPetsAllowed(Boolean(initialListing.petsAllowed));
      if (initialListing.heatingType) setHeatingType(initialListing.heatingType);
      setHasAirConditioning(Boolean(initialListing.hasAirConditioning));
      setHasWashingMachine(Boolean(initialListing.hasWashingMachine));
      setHasWifi(Boolean(initialListing.hasWifi));
      setHasBikeParking(Boolean(initialListing.hasBikeParking));
      setBikeParkingDetails(initialListing.bikeParkingDetails || '');
      setHasParking(Boolean(initialListing.hasParking));
      setParkingDetails(initialListing.parkingDetails || '');
      if (initialListing.lat) setLat(initialListing.lat);
      if (initialListing.lng) setLng(initialListing.lng);
      if (initialListing.distanceToFaculty) setDistanceToFaculty(initialListing.distanceToFaculty);
      if (initialListing.images && initialListing.images.length > 0) {
        setImages(initialListing.images);
      }
      setHasVideoTour(Boolean(initialListing.hasVideoTour));
      if (initialListing.videoUrl) setVideoTourUrl(initialListing.videoUrl);
      if (initialListing.videoAngles) setVideoAngles(anglesFromListing(initialListing.videoAngles));
      if (initialListing.currentFlatmates?.[0]) {
        setFlatmateName(initialListing.currentFlatmates[0].name || '');
        setFlatmateFaculty(initialListing.currentFlatmates[0].faculty || '');
      }
    }
  }, [initialListing, isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingPhoto(true);
    setUploadProgress(10);
    setSubmitError(null);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadListingPhoto(file, currentUser?.id || '', (p) => {
          setUploadProgress(Math.round(((i + p / 100) / files.length) * 100));
        });
        if (url) newUrls.push(url);
      }
      setImages((prev) => [...prev, ...newUrls]);
    } catch (err) {
      console.error('Error uploading photos:', err);
      setSubmitError((err as Error)?.message || 'Fotoğraf yüklenemedi.');
    } finally {
      setIsUploadingPhoto(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddImageUrl = () => {
    if (!customImageUrl.trim()) return;
    setImages((prev) => [...prev, customImageUrl.trim()]);
    setCustomImageUrl('');
  };

  const handleMakeCoverPhoto = (idx: number) => {
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      return [item, ...copy];
    });
  };

  const handleRemovePhoto = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFillDemoPhotos = () => {
    setImages([
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
    ]);
  };

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
  const [femaleCount, setFemaleCount] = useState('1');
  const [maleCount, setMaleCount] = useState('2');
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
    if (images.length === 0) {
      setSubmitError('Lütfen en az bir fotoğraf ekleyin.');
      return;
    }

    setSubmitError(null);
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
      const safeImages = images;
      const contractStartISO = isImmediate ? '' : contractStartDate;
      const videoUrl = hasVideoTour ? (videoTourUrl.trim() || undefined) : undefined;
      const listingVideoAngles = hasVideoTour ? anglesToListing(videoAngles) : undefined;
      const fairPrice = evaluateFairPrice(Number(price) || 400, district, roomType);
      const flatmates = flatmateName.trim()
        ? [{ name: flatmateName.trim(), age: 22, faculty: flatmateFaculty.trim() || 'UniPD', traits: '', icon: 'grad' }]
        : [];

      if (initialListing) {
        // Edit Mode: update existing listing
        const updates: Partial<HousingListing> = {
          title: title.trim(),
          district,
          streetAddress: address,
          lat: finalLat,
          lng: finalLng,
          distanceToFaculty: distanceToFaculty || nearestFacultyText || 'Fakülteye yakın',
          price: Number(price) || 400,
          expenses,
          ...fairPrice,
          roomType,
          contractType,
          contractStartDate: formattedStartDate,
          contractStartISO,
          contractDuration,
          hasVideoTour: hasVideoTour && Boolean(videoUrl || listingVideoAngles?.length),
          videoUrl,
          videoAngles: listingVideoAngles,
          videoTitle: hasVideoTour ? (initialListing.videoTitle || '360° Oda ve Ortak Alan Canlı Turu') : undefined,
          currentFlatmates: flatmates,
          totalHousemates: Number(totalHousemates) || 3,
          genderPreference,
          femaleCount: Number(femaleCount) || 0,
          maleCount: Number(maleCount) || 0,
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
          description: description.trim() || initialListing.description,
          images: safeImages,
        };
        if (onUpdateListing) {
          await onUpdateListing(initialListing.id, updates);
        }
        onClose();
        return;
      }

      // Create Mode: new listing
      const newListing: HousingListing = {
        id: `PD-${crypto.randomUUID()}`,
        title: title.trim(),
        district,
        streetAddress: address,
        lat: finalLat,
        lng: finalLng,
        distanceToFaculty: distanceToFaculty || nearestFacultyText || 'Fakülteye yakın',
        price: Number(price) || 400,
        expenses,
        ...fairPrice,
        roomType,
        contractType,
        contractStartDate: formattedStartDate,
        contractStartISO,
        contractDuration,
        hasVideoTour: hasVideoTour && Boolean(videoUrl || listingVideoAngles?.length),
        videoUrl,
        videoAngles: listingVideoAngles,
        videoTitle: hasVideoTour ? '360° Oda ve Ortak Alan Canlı Turu' : undefined,
        // Rozet sunucu tarafında kullanıcının doğrulanmış UniPD e-postasına göre belirlenir (AppContext + kurallar).
        isStudentCardVerified: Boolean(currentUser?.studentIdVerified),
        // Uyum skoru henüz hesaplanmıyor; 0 = gösterme.
        compatibilityScore: 0,
        compatibilityReason: '',
        currentFlatmates: flatmates,
        totalHousemates: Number(totalHousemates) || 3,
        genderPreference,
        femaleCount: Number(femaleCount) || 0,
        maleCount: Number(maleCount) || 0,
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
          verifiedUniPD: Boolean(currentUser?.studentIdVerified),
          department: currentUser?.faculty || 'UniPD',
          phone: currentUser?.phone || undefined,
        },
        images: safeImages,
        createdAt: new Date().toISOString(),
        views: 0,
      };

      const addFn = onAddListing || onSubmitListing;
      if (addFn) {
        await addFn(newListing);
      }
      onClose();
    } catch (err) {
      console.error('Failed to submit listing:', err);
      setSubmitError((err as Error)?.message?.startsWith('{')
        ? 'İlan kaydedilemedi. Yetkiniz olmayabilir veya bağlantı sorunu var.'
        : (err as Error)?.message || 'İlan kaydedilemedi.');
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
            <span className={`px-2.5 py-0.5 font-bold uppercase text-[10px] rounded-full ${isEditMode || initialListing ? 'bg-amber-600 text-white' : 'bg-orange-600 text-white'}`}>
              {isEditMode || initialListing ? (currentLang === 'it' ? 'MODIFICA' : 'DÜZENLEME') : t.postAdBtn}
            </span>
            <h3 className="font-bold text-sm">
              {isEditMode || initialListing ? (currentLang === 'it' ? 'Modifica Annuncio' : 'İlanı Düzenle') : t.newListingHeader}
            </h3>
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

              {/* Cinsiyet Dağılımı: serbest metin yerine sayı alanları, her dilde doğru biçimlenebilsin diye */}
              <div>
                <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                  {t.genderDistributionLabel}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={femaleCount}
                      onChange={(e) => setFemaleCount(e.target.value)}
                      aria-label={t.genderCountFemale}
                      className="w-full border border-stone-200 bg-white rounded-xl p-2.5 pr-16 text-xs text-stone-900 outline-none focus:border-amber-500 transition min-h-[40px]"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 font-semibold pointer-events-none">
                      {t.genderCountFemale}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={maleCount}
                      onChange={(e) => setMaleCount(e.target.value)}
                      aria-label={t.genderCountMale}
                      className="w-full border border-stone-200 bg-white rounded-xl p-2.5 pr-16 text-xs text-stone-900 outline-none focus:border-amber-500 transition min-h-[40px]"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 font-semibold pointer-events-none">
                      {t.genderCountMale}
                    </span>
                  </div>
                </div>
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

          {/* FOTOĞRAFLAR & GALERİ YÖNETİMİ */}
          <div className="p-4 bg-stone-50 border border-stone-200/90 rounded-2xl space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-orange-600" />
                <h4 className="font-bold text-xs uppercase tracking-wide text-stone-900">
                  {currentLang === 'tr' ? 'İlan Fotoğrafları & Galeri' : currentLang === 'it' ? 'Foto & Galleria Annuncio' : 'Listing Photos & Gallery'}
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                  {images.length} {currentLang === 'tr' ? 'Görsel' : 'Photos'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFillDemoPhotos}
                  className="text-[11px] font-semibold text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{currentLang === 'tr' ? 'Örnek Fotoğraf Doldur' : 'Riempi Foto Esempio'}</span>
                </button>
              </div>
            </div>

            {/* Fotoğraf Ekleme Alanı (Dosya Yükleme veya URL Ekleme) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Cihazdan / Bilgisayardan Fotoğraf Yükle */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="w-full h-11 border-2 border-dashed border-orange-300 hover:border-orange-500 bg-orange-50/50 hover:bg-orange-50 text-orange-700 font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer text-xs"
                >
                  {isUploadingPhoto ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                      <span>{currentLang === 'tr' ? `Yükleniyor (%${uploadProgress})...` : `Caricamento (%${uploadProgress})...`}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-orange-600" />
                      <span>{currentLang === 'tr' ? 'Cihazdan Fotoğraf Seç / Yükle' : 'Carica Foto dal Dispositivo'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* URL ile Görsel Ekle */}
              <div className="flex items-center gap-1.5">
                <input
                  type="url"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                  placeholder="https://.../resim.jpg"
                  className="flex-1 border border-stone-200 bg-white rounded-xl p-2.5 text-xs text-stone-900 outline-none focus:border-orange-500 transition min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  disabled={!customImageUrl.trim()}
                  className="h-11 px-3 bg-stone-900 hover:bg-black disabled:bg-stone-300 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1 transition cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{currentLang === 'tr' ? 'Ekle' : 'Aggiungi'}</span>
                </button>
              </div>
            </div>

            {/* Fotoğraf Küçük Resimleri Galerisi */}
            {images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className={`group relative rounded-xl overflow-hidden border bg-stone-100 aspect-4/3 transition shadow-2xs ${
                      idx === 0 ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Fotoğraf ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Kapak Rozeti */}
                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 bg-orange-600/95 text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span>{currentLang === 'tr' ? 'Kapak' : 'Copertina'}</span>
                      </span>
                    )}

                    {/* Hover Eylem Butonları */}
                    <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMakeCoverPhoto(idx)}
                          title={currentLang === 'tr' ? 'Kapak Fotoğrafı Yap' : 'Imposta come copertina'}
                          className="bg-white/95 hover:bg-white text-stone-900 text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1"
                        >
                          <Star className="w-3 h-3 text-amber-500" />
                          <span>{currentLang === 'tr' ? 'Kapak Yap' : 'Copertina'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        title={currentLang === 'tr' ? 'Fotoğrafı Sil' : 'Rimuovi foto'}
                        className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-lg shadow-sm transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-stone-200 rounded-xl text-center text-stone-500 space-y-1">
                <ImageIcon className="w-6 h-6 mx-auto text-stone-400" />
                <p className="text-xs font-semibold">
                  {currentLang === 'tr' ? 'Henüz fotoğraf eklenmedi.' : 'Nessuna foto aggiunta.'}
                </p>
                <p className="text-[10px] text-stone-400">
                  {currentLang === 'tr'
                    ? 'Fotoğraf eklemek veya örnek fotoğraflarla doldurmak için yukarıdaki butonları kullanabilirsiniz.'
                    : 'Usa i pulsanti sopra per caricare foto o riempire con esempi.'}
                </p>
              </div>
            )}
          </div>

          {/* 360° CANLI VİDEO TUR & VİDEO EKLEME */}
          <div className="p-4 bg-purple-50/60 border border-purple-200/90 rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-purple-200/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-700" />
                <h4 className="font-bold text-xs uppercase tracking-wide text-purple-950">
                  {currentLang === 'tr' ? '360° Canlı Video Tur & Sanal Gezinti' : currentLang === 'it' ? 'Tour Video 360° & Vista Virtuale' : '360° Live Video Tour'}
                </h4>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-[11px] font-semibold text-purple-900">
                  {hasVideoTour ? (currentLang === 'tr' ? 'Video Tur Aktif' : 'Tour Attivo') : (currentLang === 'tr' ? 'Kapalı' : 'Disattivato')}
                </span>
                <input 
                  type="checkbox" 
                  checked={hasVideoTour}
                  onChange={(e) => setHasVideoTour(e.target.checked)}
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </label>
            </div>

            {hasVideoTour && (
              <div className="space-y-3 animate-in fade-in">
                {/* Ana Video URL Girişi */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-stone-700 uppercase text-[10px] tracking-wide">
                      {currentLang === 'tr' ? 'Ana 360° Video URL (MP4 / WebM / Cloud)' : 'URL Video Principale 360°'}
                    </label>
                  </div>
                  <input
                    type="url"
                    value={videoTourUrl}
                    onChange={(e) => setVideoTourUrl(e.target.value)}
                    placeholder="https://.../oda-turu.mp4"
                    className="w-full border border-purple-200 bg-white rounded-xl p-2.5 text-xs text-stone-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition min-h-[42px]"
                  />
                </div>

                {/* Canlı Video Önizleme Oynatıcısı */}
                {videoTourUrl.trim() && (
                  <div className="rounded-xl overflow-hidden border border-purple-200 bg-stone-950 p-2 space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between text-[10px] px-1 text-white">
                      <span className="flex items-center gap-1.5 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>{currentLang === 'tr' ? 'Canlı Video Önizleme' : 'Anteprima Video'}</span>
                      </span>
                      <span className="text-purple-300 font-mono text-[9px]">HTML5 Video</span>
                    </div>
                    <video
                      key={videoTourUrl}
                      src={videoTourUrl}
                      controls
                      playsInline
                      className="w-full h-36 rounded-lg object-cover bg-black"
                    />
                  </div>
                )}

                {/* Çok Açılı Video (Oda, Masa, Mutfak, Balkon) Gelişmiş Açılar */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedVideoAngles((prev) => !prev)}
                    className="text-[11px] font-bold text-purple-800 hover:text-purple-950 flex items-center gap-1 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>
                      {showAdvancedVideoAngles
                        ? (currentLang === 'tr' ? 'Gelişmiş Kamera Açılarını Gizle ▲' : 'Nascondi Altre Angolazioni ▲')
                        : (currentLang === 'tr' ? 'Farklı Kamera Açıları Ekle (Masa, Mutfak, Balkon) ▼' : 'Aggiungi Altre Angolazioni ▼')}
                    </span>
                  </button>

                  {showAdvancedVideoAngles && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 p-3 bg-white/80 rounded-xl border border-purple-100">
                      <div>
                        <label className="text-[10px] font-semibold text-stone-600 block mb-0.5">
                          {currentLang === 'tr' ? 'Çalışma Masası Açısı Video URL' : 'Angolazione Scrivania URL'}
                        </label>
                        <input
                          type="url"
                          value={videoAngles.desk || ''}
                          onChange={(e) => setVideoAngles((prev) => ({ ...prev, desk: e.target.value }))}
                          placeholder="https://.../desk.mp4"
                          className="w-full border border-stone-200 rounded-lg p-2 text-xs outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-stone-600 block mb-0.5">
                          {currentLang === 'tr' ? 'Mutfak / Ortak Alan Video URL' : 'Angolazione Cucina URL'}
                        </label>
                        <input
                          type="url"
                          value={videoAngles.kitchen || ''}
                          onChange={(e) => setVideoAngles((prev) => ({ ...prev, kitchen: e.target.value }))}
                          placeholder="https://.../kitchen.mp4"
                          className="w-full border border-stone-200 rounded-lg p-2 text-xs outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-semibold text-stone-600 block mb-0.5">
                          {currentLang === 'tr' ? 'Balkon / Şehir Manzarası Video URL' : 'Angolazione Balcone URL'}
                        </label>
                        <input
                          type="url"
                          value={videoAngles.balcony || ''}
                          onChange={(e) => setVideoAngles((prev) => ({ ...prev, balcony: e.target.value }))}
                          placeholder="https://.../balcony.mp4"
                          className="w-full border border-stone-200 rounded-lg p-2 text-xs outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
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

          {submitError && (
            <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              {submitError}
            </div>
          )}

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full py-3.5 text-xs uppercase tracking-wider font-bold text-white rounded-xl cursor-pointer shadow-sm active:translate-y-0.5 transition min-h-[44px] flex items-center justify-center gap-2 ${
                isEditMode || initialListing
                  ? 'bg-amber-600 hover:bg-amber-700 disabled:bg-stone-400'
                  : 'bg-orange-600 hover:bg-orange-700 disabled:bg-stone-400'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isEditMode || initialListing ? 'Değişiklikler Kaydediliyor...' : 'İlan ve Konum Kaydediliyor...'}</span>
                </>
              ) : (
                <>
                  {isEditMode || initialListing ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  <span>{isEditMode || initialListing ? (currentLang === 'it' ? 'Salva Modifiche' : 'Değişiklikleri Kaydet') : t.publishListingBtn}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export const CreateListingModal: React.FC<CreateListingModalProps> = (props) =>
  props.isOpen ? <CreateListingModalContent {...props} /> : null;
