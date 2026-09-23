export type Language = 'tr' | 'en' | 'it' | 'de' | 'ru' | 'hi';

export type ContractType = 
  | 'Contratto per Studenti (Canone Concordato)'
  | 'Subentro (Resmi Sözleşme Devri)'
  | 'Contratto Transitorio (1-18 Ay)'
  | 'Standart 4+4 / 3+2 Yıllık';

export type DistrictArea = 
  | 'Tümü'
  | 'Policlinico / Tıp Fakültesi (< 500m)'
  | 'Portello / Mühendislik & Fen (< 500m)'
  | 'Beato Pellegrino / Beşeri Bilimler'
  | 'Centro Storico / Prato della Valle'
  | 'Forcellini'
  | 'Arcella'
  | 'Guizza';

export type RoomType = 'Singola' | 'Doppia' | 'Posto Letto' | 'Monolocale' | 'Bilocale';

export interface Flatmate {
  name: string;
  age: number;
  faculty: string;
  year?: string;
  traits: string;
  icon: string;
}

export interface PosterInfo {
  id?: string;
  username: string;
  name: string;
  avatar: string;
  verifiedUniPD: boolean;
  department: string;
  year?: string;
  phone?: string;
}

export type VideoAngleId = 'room' | 'desk' | 'kitchen' | 'view';

export interface VideoAngle {
  id: VideoAngleId;
  label: string;
  videoUrl: string;
  poster?: string;
}

export interface HousingListing {
  id: string;
  userId?: string;
  title: string;
  district: DistrictArea;
  streetAddress: string;
  distanceToFaculty: string;
  price: number;
  expenses: string;
  fairPriceStatus: 'lower' | 'average' | 'higher';
  fairPriceText: string;
  roomType: RoomType;
  contractType: ContractType;
  contractStartDate?: string;
  // YYYY-MM-DD; boşsa "hemen taşınılabilir". Başlangıç tarihi filtresi bunu kullanır.
  contractStartISO?: string;
  // Biçimlendirilmiş görüntüleme metni (ör. "1 Ekim 2027"), contractStartDate ile aynı desende.
  contractEndDate?: string;
  // YYYY-MM-DD ham değer; düzenleme formunda takvime geri yüklemek için kullanılır.
  contractEndISO?: string;
  hasVideoTour: boolean;
  videoTitle?: string;
  videoUrl?: string;
  videoAngles?: VideoAngle[];
  isStudentCardVerified: boolean;
  compatibilityScore: number;
  compatibilityReason: string;
  currentFlatmates: Flatmate[];
  // Roommate & Flat Profile
  totalHousemates?: number;
  genderPreference?: 'female_only' | 'male_only' | 'any';
  // Ev sakinlerinin cinsiyet dağılımı; serbest metin değil, dil değişince otomatik yeniden
  // biçimlendirilebilsin diye yapılandırılmış sayı alanları olarak tutulur.
  femaleCount?: number;
  maleCount?: number;
  occupantType?: 'students_only' | 'workers_only' | 'mixed';
  smokingAllowed?: boolean;
  petsAllowed?: boolean;
  // Critical Amenities & Equipment
  heatingType?: 'autonomo' | 'centralizzato';
  hasAirConditioning?: boolean;
  hasWashingMachine?: boolean;
  hasWifi?: boolean;
  hasBikeParking?: boolean;
  bikeParkingDetails?: string;
  hasParking?: boolean;
  parkingDetails?: string;
  roomM2: number;
  apartmentM2: number;
  bathrooms: number;
  confirmationTimeLeft: string;
  description: string;
  poster: PosterInfo;
  images: string[];
  createdAt: string;
  updatedAt?: string;
  views: number;
  lat?: number;
  lng?: number;
  isArchived?: boolean;
  rentedAt?: string;
  rentedPrice?: number;
  archiveReason?: string;
  tenantType?: string;
}

export interface FilterState {
  categoryTab: 'all' | 'video' | 'transitorio' | 'subentro' | 'roommates' | 'newest';
  searchQuery: string;
  contractType: string;
  district: string;
  maxPrice: number;
  onlyVideoTour: boolean;
  onlyStudentVerified: boolean;
  onlyHighCompatibility: boolean;
  roomType: string;
  sortBy: 'relevance' | 'price-asc' | 'price-desc' | 'compatibility-desc' | 'newest';
  contractStartDateFilter?: string;
  genderPreferenceFilter?: 'all' | 'female_only' | 'male_only' | 'any';
  heatingTypeFilter?: 'all' | 'autonomo' | 'centralizzato';
  onlyAirConditioning?: boolean;
  onlyWashingMachine?: boolean;
  onlyWifi?: boolean;
  onlyBikeParking?: boolean;
  onlyParking?: boolean;
  occupantTypeFilter?: 'all' | 'students_only' | 'workers_only' | 'mixed';
  smokingFilter?: 'all' | 'allowed' | 'forbidden';
  petsFilter?: 'all' | 'allowed' | 'forbidden';
}

export type ActiveView = 'home' | 'myListings' | 'messages' | 'profile' | 'listingDetail' | 'admin' | 'notifications';

export type NotificationType = 'message' | 'listing' | 'security' | 'tenant' | 'system' | 'admin';

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  timestamp: number;
  linkView?: ActiveView;
  linkId?: string;
}

export interface DirectMessage {
  id: string;
  sender: 'user' | 'target' | 'system';
  text: string;
  time: string;
  timestamp?: number;
}

// Firestore'daki /messages belgesi.
export interface FirestoreMessage {
  id: string;
  senderId: string;
  recipientId: string;
  participants: string[];
  text: string;
  listingId?: string;
  subject?: string;
  read: boolean;
  createdAt: number;
}

export interface ConversationContact {
  // Karşı tarafın Firebase UID'si; sohbetler kişi bazında gruplanır.
  id: string;
  username: string;
  name: string;
  avatar: string;
  department: string;
  subject: string;
  listingId?: string;
  unreadCount: number;
  online: boolean;
  lastMessageTime: string;
  messages: DirectMessage[];
}

export interface UserProfile {
  id?: string;
  userHash: string;
  role: 'student' | 'landlord' | 'admin' | 'superadmin';
  username: string;
  name: string;
  avatar: string;
  faculty: string;
  year?: string;
  studentIdVerified: boolean;
  ssoVerified: boolean;
  ssoProvider?: string;
  matricola?: string;
  email: string;
  bio?: string;
  phone?: string;
  photoURL?: string;
  myListingsCount: number;
  pendingApproval: number;
  savedListings?: string[];
  savedListingIds?: string[];
  compatibilityPreferences: {
    quietHours: string;
    smoking: string;
    studyVibe: string;
    cleanlinessRating: string;
  };
}
