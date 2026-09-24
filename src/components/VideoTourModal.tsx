import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  ShieldCheck, 
  Video, 
  Compass, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  RotateCw, 
  RotateCcw,
  Sparkles,
  RefreshCw,
  Eye
} from 'lucide-react';
import { HousingListing, Language, VideoAngleId } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { getLocalizedListing } from '../utils/listingTranslator';

interface VideoTourModalProps {
  listing: HousingListing | null;
  onClose: () => void;
  currentLang?: Language;
}


// Hook'lar koşulsuz çağrılsın diye içerik yalnızca ilan varken mount edilir.
const VideoTourModalContent: React.FC<Omit<VideoTourModalProps, 'listing'> & { listing: HousingListing }> = ({
  listing: rawListing,
  onClose,
  currentLang = 'tr',
}) => {

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.tr;
  const listing = getLocalizedListing(rawListing, currentLang);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeCamera, setActiveCamera] = useState<'room' | 'desk' | 'kitchen' | 'view'>('room');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 360° Interactive Pan Angle (-40° to +40° viewport pan)
  const [panOffset, setPanOffset] = useState(0);
  const [isAutoPan, setIsAutoPan] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartPan = useRef(0);

  // Yalnızca ilan sahibinin eklediği videolar gösterilir (örnek videolara düşülmez).
  const angleLabels: Record<VideoAngleId, string> = {
    room: t.videoAngleWide,
    desk: t.videoAngleDesk,
    kitchen: t.videoAngleShared || 'Mutfak / Ortak',
    view: 'Balkon / Manzara',
  };
  const angleOrder: VideoAngleId[] = ['room', 'desk', 'kitchen', 'view'];
  const cameraAngles = angleOrder
    .map((id, idx) => ({
      id,
      label: angleLabels[id],
      videoUrl: rawListing.videoAngles?.find(a => a.id === id)?.videoUrl || (id === 'room' ? rawListing.videoUrl : undefined) || '',
      poster: listing.images[idx] || listing.images[0],
    }))
    .filter(angle => angle.videoUrl);

  const currentAngle = cameraAngles.find(c => c.id === activeCamera) || cameraAngles[0];

  // İlk mevcut açıya geç (örn. yalnızca mutfak videosu eklenmişse)
  useEffect(() => {
    if (cameraAngles.length > 0 && !cameraAngles.some(c => c.id === activeCamera)) {
      setActiveCamera(cameraAngles[0].id);
    }
  }, [cameraAngles.length]);

  // Auto-pan effect simulating 360 camera swing
  useEffect(() => {
    if (!isAutoPan || isDragging) return;
    const interval = setInterval(() => {
      setPanOffset((prev) => {
        const next = prev + 0.35;
        return next > 35 ? -35 : next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isAutoPan, isDragging]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Handle Mute
  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  // Handle Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Drag to 360 pan
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsAutoPan(false);
    dragStartX.current = e.clientX;
    dragStartPan.current = panOffset;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const delta = (e.clientX - dragStartX.current) * 0.25;
    const newPan = Math.max(-50, Math.min(50, dragStartPan.current + delta));
    setPanOffset(newPan);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag for mobile 360 pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!e.touches[0]) return;
    setIsDragging(true);
    setIsAutoPan(false);
    dragStartX.current = e.touches[0].clientX;
    dragStartPan.current = panOffset;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !e.touches[0]) return;
    const delta = (e.touches[0].clientX - dragStartX.current) * 0.3;
    const newPan = Math.max(-50, Math.min(50, dragStartPan.current + delta));
    setPanOffset(newPan);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  if (!currentAngle) {
    return (
      <div className="fixed inset-0 z-50 bg-stone-950/80 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-3" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm font-bold text-stone-900">{t.videoNone}</p>
          <button
            type="button"
            onClick={onClose}
            className="bg-stone-900 hover:bg-stone-800 text-white px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        ref={containerRef}
        className="max-w-3xl w-full bg-stone-900 rounded-3xl border border-stone-800 shadow-2xl overflow-hidden flex flex-col space-y-3 p-4 sm:p-5 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Bar */}
        <div className="flex justify-between items-center pb-2 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-600/20 text-orange-500 flex items-center justify-center border border-orange-500/30">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-stone-100">{t.liveVideoTour}</h4>
                <span className="text-[10px] bg-red-500/90 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                  {t.liveHdTour}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 truncate max-w-sm sm:max-w-md">
                {listing.title} • {listing.streetAddress}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleFullscreen}
              className="p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-xl transition cursor-pointer"
              title={t.fullscreen}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button 
              onClick={onClose} 
              className="p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-xl transition cursor-pointer"
              aria-label={t.closeBtn}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Canvas Container with 360° Drag & Zoom */}
        <div 
          className="relative aspect-video bg-black rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing border border-stone-800 shadow-inner group"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Real HTML5 Video Player with 360 Panoramic Transform */}
          <video
            ref={videoRef}
            key={currentAngle.videoUrl}
            src={currentAngle.videoUrl}
            poster={currentAngle.poster}
            playsInline
            autoPlay
            loop
            muted={isMuted}
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
              }
            }}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setDuration(videoRef.current.duration);
                setIsLoading(false);
                setHasError(false);
              }
            }}
            onWaiting={() => setIsLoading(true)}
            onPlaying={() => {
              setIsLoading(false);
              setIsPlaying(true);
            }}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-100 ease-out"
            style={{
              transform: `scale(1.18) translateX(${panOffset * 0.4}%)`,
            }}
          />

          {/* Top Info Bar Overlays */}
          <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between text-[11px] pointer-events-none">
            <div className="bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-xl border border-white/10 flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="font-semibold">{t.liveVerifiedFootage}</span>
              <span className="text-stone-400">|</span>
              <span className="text-orange-400 font-mono text-[10px]">1080p 60FPS</span>
            </div>

            <div className="bg-black/70 backdrop-blur-md text-stone-200 px-3 py-1 rounded-xl border border-white/10 flex items-center gap-1.5 shadow-lg">
              <Compass className="w-3.5 h-3.5 text-orange-400 animate-spin" style={{ animationDuration: '8s' }} />
              <span className="font-mono text-[10px]">
                {t.angle360}: {Math.round(panOffset + 180)}°
              </span>
            </div>
          </div>

          {/* Loading / Buffering Spinner */}
          {isLoading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-2xs">
              <div className="p-3 bg-stone-900/90 rounded-2xl border border-stone-700 flex items-center gap-2.5 text-xs text-stone-200 shadow-xl">
                <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                <span>{t.videoLoading}</span>
              </div>
            </div>
          )}

          {/* Error Notice */}
          {hasError && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
              <div className="p-4 bg-stone-900/95 rounded-2xl border border-red-500/40 text-center max-w-sm space-y-2">
                <p className="text-xs text-red-400 font-bold">{t.videoLoadFail}</p>
                <p className="text-[11px] text-stone-400">{t.fallback360}</p>
                <button
                  onClick={() => {
                    setHasError(false);
                    setIsLoading(true);
                    if (videoRef.current) videoRef.current.load();
                  }}
                  className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {t.retryBtn}
                </button>
              </div>
            </div>
          )}

          {/* Big Center Play/Pause Trigger */}
          <div 
            className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer"
            onClick={togglePlay}
          >
            {!isPlaying && (
              <div className="w-16 h-16 rounded-full bg-orange-600/90 hover:bg-orange-500 text-white flex items-center justify-center transition active:scale-95 shadow-2xl backdrop-blur-xs">
                <Play className="w-7 h-7 ml-1 fill-current" />
              </div>
            )}
          </div>

          {/* 360° Pan Hint Overlay (fades out on interaction) */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-80 group-hover:opacity-100 transition">
            <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] text-stone-300 flex items-center gap-1.5 shadow-md">
              <RotateCcw className="w-3 h-3 text-orange-400" />
              <span>{t.dragToRotate}</span>
              <RotateCw className="w-3 h-3 text-orange-400" />
            </div>
          </div>

          {/* Bottom Video Controls Overlay */}
          <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-6 space-y-2">
            
            {/* Scrubber Timeline */}
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-stone-700 rounded-full appearance-none cursor-pointer accent-orange-500 hover:h-2 transition-all"
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between text-xs text-white">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
                  title={isPlaying ? t.videoPause : t.videoPlay}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
                  title={isMuted ? t.muteOff : t.muteOn}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </button>

                {/* Timestamp */}
                <div className="text-[11px] font-mono text-stone-300">
                  <span>{formatTime(currentTime)}</span>
                  <span className="text-stone-500 mx-1">/</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* 360° Quick Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPanOffset((p) => Math.max(-50, p - 15))}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-medium text-stone-300 flex items-center gap-1 transition cursor-pointer"
                  title={t.rotateLeft}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.leftShort}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAutoPan(!isAutoPan)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 transition cursor-pointer ${
                    isAutoPan ? 'bg-orange-600 text-white font-bold' : 'bg-white/10 text-stone-300 hover:bg-white/20'
                  }`}
                  title={t.autoScan}
                >
                  <Compass className="w-3 h-3" />
                  <span>{t.auto360}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPanOffset((p) => Math.min(50, p + 15))}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-medium text-stone-300 flex items-center gap-1 transition cursor-pointer"
                  title={t.rotateRight}
                >
                  <span>{t.rightShort}</span>
                  <RotateCw className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Camera Angle Selector Tabs */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-400 text-[11px] font-medium flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-orange-400" />
              <span>{t.cameraAnglesTitle}:</span>
            </span>
            <span className="text-[10px] text-stone-500 font-mono">{t.activePoints}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {cameraAngles.map((cam) => (
              <button
                key={cam.id}
                onClick={() => {
                  setActiveCamera(cam.id);
                  setPanOffset(0);
                  setIsLoading(true);
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                  }
                }}
                className={`p-2.5 rounded-xl transition cursor-pointer text-left border flex items-center gap-2.5 ${
                  activeCamera === cam.id
                    ? 'bg-stone-800 border-orange-500 text-white shadow-md'
                    : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:bg-stone-800/60 hover:text-stone-200'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${activeCamera === cam.id ? 'bg-orange-500 animate-ping' : 'bg-stone-600'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">{cam.label}</p>
                  <p className="text-[10px] text-stone-500">1080p HD</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Official Padova Field Officer Verification Badge */}
        <div className="p-3 bg-stone-950/70 border border-stone-800/80 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="font-semibold text-[11px]">
              {t.fieldOfficerVerified}
            </span>
          </div>
          <span className="text-[10px] text-stone-500 font-mono">
            {t.verificationId}: #VRF-{listing.id}
          </span>
        </div>

      </div>
    </div>
  );
};

export const VideoTourModal: React.FC<VideoTourModalProps> = ({ listing, ...rest }) =>
  listing ? <VideoTourModalContent {...rest} listing={listing} /> : null;
