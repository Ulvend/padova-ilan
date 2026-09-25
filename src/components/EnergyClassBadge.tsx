import React from 'react';
import type { EnergyClass } from '../types';

// Avrupa enerji etiketi renkleri (A4 en verimli, G en düşük).
const TONES: Record<Exclude<EnergyClass, 'pending'>, string> = {
  A4: 'bg-green-700 text-white',
  A3: 'bg-green-600 text-white',
  A2: 'bg-green-500 text-white',
  A1: 'bg-lime-500 text-stone-900',
  B: 'bg-lime-400 text-stone-900',
  C: 'bg-yellow-400 text-stone-900',
  D: 'bg-amber-400 text-stone-900',
  E: 'bg-orange-500 text-white',
  F: 'bg-orange-600 text-white',
  G: 'bg-red-600 text-white',
};

interface EnergyClassBadgeProps {
  value: EnergyClass;
  pendingLabel: string;
  /** Kartlarda kısa gösterim ("APE B"). */
  compact?: boolean;
}

export const EnergyClassBadge: React.FC<EnergyClassBadgeProps> = ({ value, pendingLabel, compact = false }) => {
  if (value === 'pending') {
    return <span className="inline-flex items-center rounded-md bg-stone-200 px-2 py-0.5 text-xs font-bold text-stone-700">{pendingLabel}</span>;
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-extrabold tracking-wide ${TONES[value]}`}
      title={`APE ${value}`}
    >
      {compact ? `APE ${value}` : value}
    </span>
  );
};
