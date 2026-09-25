import type { EnergyClass } from '../types';

// Açılır listedeki sıra: önce sertifika durumu seçenekleri, sonra sınıflar (A4 en verimli, G en düşük).
export const ENERGY_CLASS_OPTIONS: EnergyClass[] = ['pending', 'exempt', 'unclassifiable', 'A4', 'A3', 'A2', 'A1', 'B', 'C', 'D', 'E', 'F', 'G'];

export type RatedEnergyClass = Exclude<EnergyClass, 'pending' | 'exempt' | 'unclassifiable'>;

/** Gerçek bir enerji sınıfı (A4–G). Diğerleri sertifika durumunu belirtir; enerji endeksi yalnızca sınıflı konutlarda anlamlıdır. */
export const isRatedEnergyClass = (c: EnergyClass | '' | undefined): c is RatedEnergyClass =>
  Boolean(c) && c !== 'pending' && c !== 'exempt' && c !== 'unclassifiable';

// EPgl / IPE üst sınırı (kWh/m² yıl). Veritabanı kısıtıyla aynı olmalı.
export const ENERGY_PERFORMANCE_MAX = 2000;

/** Rozet için sertifika durumu metinleri (`t` çeviri sözlüğünden). */
export const energyStatusLabels = (t: {
  energyClassPending: string;
  energyClassExempt: string;
  energyClassUnclassifiable: string;
}) => ({ pending: t.energyClassPending, exempt: t.energyClassExempt, unclassifiable: t.energyClassUnclassifiable });
