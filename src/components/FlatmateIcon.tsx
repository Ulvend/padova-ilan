import React from 'react';
import {
  GraduationCap,
  Stethoscope,
  Cpu,
  Coffee,
  BookOpen,
  BarChart3,
  Ruler,
  Leaf,
  Brain,
  User,
  Music,
  Palette,
  Dumbbell,
  HeartPulse,
} from 'lucide-react';

interface FlatmateIconProps {
  iconName?: string;
  className?: string;
}

export const FlatmateIcon: React.FC<FlatmateIconProps> = ({ 
  iconName = '', 
  className = 'w-4 h-4 text-orange-600' 
}) => {
  const norm = iconName.toLowerCase().trim();

  if (norm.includes('stetho') || norm.includes('doctor') || norm.includes('med') || norm.includes('tip')) {
    return <Stethoscope className={className} />;
  }
  if (norm.includes('cpu') || norm.includes('gear') || norm.includes('tech') || norm.includes('muh') || norm.includes('eng')) {
    return <Cpu className={className} />;
  }
  if (norm.includes('coffee') || norm.includes('kahve') || norm.includes('cafe')) {
    return <Coffee className={className} />;
  }
  if (norm.includes('book') || norm.includes('kitap') || norm.includes('read') || norm.includes('study')) {
    return <BookOpen className={className} />;
  }
  if (norm.includes('chart') || norm.includes('stat') || norm.includes('econ') || norm.includes('istatistik')) {
    return <BarChart3 className={className} />;
  }
  if (norm.includes('ruler') || norm.includes('arch') || norm.includes('mimarlik') || norm.includes('cizim')) {
    return <Ruler className={className} />;
  }
  if (norm.includes('leaf') || norm.includes('bitki') || norm.includes('bio') || norm.includes('eco')) {
    return <Leaf className={className} />;
  }
  if (norm.includes('brain') || norm.includes('beyin') || norm.includes('psik') || norm.includes('psych')) {
    return <Brain className={className} />;
  }
  if (norm.includes('music') || norm.includes('muzik')) {
    return <Music className={className} />;
  }
  if (norm.includes('art') || norm.includes('sanat') || norm.includes('palette')) {
    return <Palette className={className} />;
  }
  if (norm.includes('sport') || norm.includes('gym') || norm.includes('fit')) {
    return <Dumbbell className={className} />;
  }
  if (norm.includes('health') || norm.includes('saglik') || norm.includes('pulse')) {
    return <HeartPulse className={className} />;
  }
  if (norm.includes('grad') || norm.includes('student') || norm.includes('unipd') || norm.includes('ogrenci')) {
    return <GraduationCap className={className} />;
  }

  return <User className={className} />;
};
