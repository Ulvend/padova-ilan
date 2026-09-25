import { HousingListing } from '../types';
import { monthsBetween } from '../components/ui/DateRangePicker';

/** İlana taşınılabilecek ilk gün: başlangıç tarihi yoksa ya da geçmişte kaldıysa bugün. */
export const availableFromISO = (l: Pick<HousingListing, 'contractStartISO'>, todayIso: string): string =>
  l.contractStartISO && l.contractStartISO > todayIso ? l.contractStartISO : todayIso;

/** Taşınılabilir günden sözleşme bitişine kalan süre (ay). Bitiş tarihi yoksa süresiz sayılır: null. */
export const stayMonths = (l: Pick<HousingListing, 'contractStartISO' | 'contractEndISO'>, todayIso: string): number | null =>
  l.contractEndISO ? monthsBetween(availableFromISO(l, todayIso), l.contractEndISO) : null;
