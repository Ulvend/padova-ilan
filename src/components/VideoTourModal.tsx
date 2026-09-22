import React, { useState } from 'react';
import { X, Play, Pause, CheckCircle2, ShieldCheck, Video, Compass, Volume2 } from 'lucide-react';
import { HousingListing, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { getLocalizedListing } from '../utils/listingTranslator';

interface VideoTourModalProps {
  listing: HousingListing | null;
  onClose: () => void;
  currentLang?: Language;
}

export const VideoTourModal: React.FC<VideoTourModalProps> = ({
  listing: rawListing,
  onClose,
  currentLang = 'tr',
}) => {
  if (!rawListing) return null;

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.tr;
  const listing = getLocalizedListing(rawListing, currentLang);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeCamera, setActiveCamera] = useState<'room' | 'desk' | 'kitchen' | 'view'>('room');

  const cameraAngles = [
    { id: 'room', label: t.videoAngleWide, img: listing.images[0] },
    { id: 'desk', label: t.videoAngleDesk, img: listing.images[1] || listing.images[0] },
    { id: 'kitchen', label: t.videoAngleShared, img: listing.images[2] || listing.images[0] },
  ];

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="max-w-xl w-full p-5 bg-white rounded-3xl border border-stone-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-purple-600" />
            <h4 className="font-bold text-sm text-stone-900">{t.liveVideoTour}</h4>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Simulation Screen with Angle switching */}
        <div className="relative aspect-video bg-stone-950 rounded-2xl overflow-hidden flex flex-col justify-between p-3 select-none border border-stone-800">
          {/* Background image of selected camera angle */}
          <img 
            src={cameraAngles.find(c => c.id === activeCamera)?.img || listing.images[0]} 
            alt="Tour" 
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />

          {/* Top overlays */}
          <div className="relative z-10 flex items-center justify-between text-[11px] text-white">
            <div className="bg-red-500 text-white px-2.5 py-0.5 font-semibold text-[10px] rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              <span>{t.liveVerifiedFootage}</span>
            </div>
            <div className="bg-black/60 px-2.5 py-0.5 rounded-lg border border-white/20 backdrop-blur-xs text-[10px] font-medium">
              {listing.streetAddress}
            </div>
          </div>

          {/* Center Play Button indicator */}
          <div className="relative z-10 flex items-center justify-center">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-14 h-14 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition active:scale-95 cursor-pointer backdrop-blur-xs shadow-lg"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1 fill-current" />}
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="relative z-10 bg-black/70 p-2 rounded-xl border border-white/10 backdrop-blur-xs text-[10px] text-white flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t.fieldOfficerVerified}
            </span>
            <span className="text-stone-300">360° • 1080p 60fps</span>
          </div>
        </div>

        {/* Angle selector tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-stone-400 mr-1 text-[11px] font-medium">{t.cameraAngleLabel}:</span>
          {cameraAngles.map((cam) => (
            <button
              key={cam.id}
              onClick={() => setActiveCamera(cam.id as any)}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer font-medium text-xs ${
                activeCamera === cam.id
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {cam.label}
            </button>
          ))}
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="w-full py-2.5 text-xs font-semibold uppercase tracking-wider bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl cursor-pointer transition"
        >
          {t.closeBtn}
        </button>
      </div>
    </div>
  );
};
