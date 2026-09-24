import React, { useState } from 'react';
import { Flag, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import type { FullDictionary } from '../utils/translations';
import { submitListingReport, type ReportCategory } from '../services/supabaseService';
import { useModalBehavior } from '../utils/useModalBehavior';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  reporterId: string;
  t: FullDictionary;
}

const MAX_REASON = 500;

// İlan sayfasındaki "Bildir" butonunun açtığı şikayet formu.
export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, listingId, reporterId, t }) => {
  const [category, setCategory] = useState<ReportCategory>('scam');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<'sent' | 'duplicate' | null>(null);

  useModalBehavior(isOpen, onClose);

  if (!isOpen) return null;

  const categories: { value: ReportCategory; label: string }[] = [
    { value: 'scam', label: t.reportCatScam },
    { value: 'fake_photo', label: t.reportCatFakePhoto },
    { value: 'inappropriate', label: t.reportCatInappropriate },
    { value: 'spam', label: t.reportCatSpam },
    { value: 'other', label: t.reportCatOther },
  ];

  const close = () => {
    onClose();
    // Kapanışta form sıfırlanır; bir sonraki açılış temiz başlar.
    setTimeout(() => {
      setDone(null);
      setError(null);
      setReason('');
      setCategory('scam');
    }, 200);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (category === 'other' && !reason.trim()) {
      setError(t.reportReasonRequired);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitListingReport({ reporterId, listingId, category, reason });
      setDone(result === 'duplicate' ? 'duplicate' : 'sent');
    } catch (err) {
      console.warn('Report error:', err);
      setError(/rate_limit_exceeded/.test(String((err as Error)?.message)) ? t.errTooFast : t.reportFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.reportTitle}
        className="bg-white w-full max-w-md rounded-2xl border border-stone-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-rose-50/50">
          <div className="flex items-center gap-2">
            <span className="bg-rose-600 text-white p-1.5 rounded-lg">
              <Flag className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-sm text-stone-900">{t.reportTitle}</h3>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={t.closeBtn}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <p className="text-sm text-stone-700 leading-relaxed">
              {done === 'duplicate' ? t.reportDuplicate : t.reportSent}
            </p>
            <button
              type="button"
              onClick={close}
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              {t.closeBtn}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-4">
            <p className="text-xs text-stone-600 leading-relaxed">{t.reportIntro}</p>

            <fieldset className="space-y-1.5">
              <legend className="text-xs font-bold text-stone-800 mb-1.5">{t.reportCategoryLabel}</legend>
              {categories.map((c) => (
                <label
                  key={c.value}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm cursor-pointer transition ${
                    category === c.value ? 'border-rose-400 bg-rose-50 text-rose-900 font-semibold' : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="report-category"
                    value={c.value}
                    checked={category === c.value}
                    onChange={() => setCategory(c.value)}
                    className="accent-rose-600"
                  />
                  {c.label}
                </label>
              ))}
            </fieldset>

            <div className="space-y-1.5">
              <label htmlFor="report-reason" className="text-xs font-bold text-stone-800 block">
                {t.reportReasonLabel}
              </label>
              <textarea
                id="report-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, MAX_REASON))}
                rows={4}
                maxLength={MAX_REASON}
                placeholder={t.reportReasonPlaceholder}
                className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-xl bg-white text-stone-900 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 resize-none"
              />
              <p className="text-[11px] text-stone-400 text-right">
                {reason.length}/{MAX_REASON}
              </p>
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[46px] bg-rose-600 hover:bg-rose-700 disabled:bg-stone-300 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {t.reportSubmit}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
