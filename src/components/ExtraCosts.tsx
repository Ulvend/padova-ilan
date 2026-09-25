import React from 'react';
import type { HousingListing } from '../types';

interface ExtraCostsProps {
  listing: Pick<HousingListing, 'deposit' | 'condoFees'>;
  t: { depositLabel: string; condoFeesLabel: string; perMonth: string };
}

/** Kira dışındaki maliyetler: depozito (deposito cauzionale) ve aylık kondominyum giderleri (spese condominiali). */
export const ExtraCosts: React.FC<ExtraCostsProps> = ({ listing, t }) => {
  if (!listing.deposit && !listing.condoFees) return null;
  return (
    <div className="space-y-1 text-sm text-stone-600">
      {listing.condoFees ? (
        <p>
          <span className="font-semibold text-stone-800">{t.condoFeesLabel}:</span> €{listing.condoFees} {t.perMonth}
        </p>
      ) : null}
      {listing.deposit ? (
        <p>
          <span className="font-semibold text-stone-800">{t.depositLabel}:</span> €{listing.deposit}
        </p>
      ) : null}
    </div>
  );
};
