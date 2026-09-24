import React, { useState } from 'react';
import { CheckCircle2, GraduationCap, Mail, RefreshCw, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { describeAuthError } from '../lib/supabase';
import { isUniPdEmail } from '../config';

/**
 * Profildeki UniPD doğrulama kartı.
 * - Doğrulanmışsa rozeti gösterir.
 * - Hesap e-postası UniPD adresi ama doğrulanmamışsa linki tekrar gönderir.
 * - Başka bir e-postayla (örn. Google) giriş yapılmışsa UniPD adresine doğrulama linki yollar;
 *   link tıklanınca hesabın e-postası UniPD adresi olur ve rozet verilir.
 */
export const UniPdVerificationCard: React.FC = () => {
  const {
    t,
    currentLang,
    currentUser,
    emailVerified,
    handleRequestUniPdVerification,
    handleResendVerificationEmail,
    handleRefreshVerification,
    showToast,
  } = useApp();

  const [unipdEmail, setUnipdEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (currentUser.studentIdVerified) {
    return (
      <div className="border border-emerald-200 bg-emerald-50/70 p-3 rounded-xl text-xs text-right">
        <span className="text-[10px] text-stone-500 block uppercase font-semibold">{t.unipdVerifTitle}</span>
        <span className="text-emerald-800 font-bold flex items-center justify-end gap-1 mt-0.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {t.studentCardVerified}
        </span>
        <span className="text-[10px] text-emerald-600 block mt-0.5 font-medium">{currentUser.email}</span>
      </div>
    );
  }

  const accountIsUniPd = isUniPdEmail(currentUser.email);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(describeAuthError(err, currentLang));
    } finally {
      setBusy(false);
    }
  };

  const handleSend = () =>
    run(async () => {
      if (accountIsUniPd && !emailVerified) {
        await handleResendVerificationEmail();
        setSentTo(currentUser.email);
      } else {
        await handleRequestUniPdVerification(unipdEmail);
        setSentTo(unipdEmail.trim());
      }
    });

  const handleCheck = () =>
    run(async () => {
      const verified = await handleRefreshVerification();
      if (verified) {
        showToast(t.toastUnipdVerified, 'success');
      } else {
        setError(t.unipdNotYet);
      }
    });

  return (
    <div className="border border-[#f3ccd2] bg-[#fdf2f4] p-3.5 rounded-xl text-xs space-y-2.5 w-full sm:w-80">
      <div className="flex items-center gap-2 text-[#7a0d1a] font-bold">
        <GraduationCap className="w-4 h-4" />
        <span>{t.unipdGetBadge}</span>
      </div>

      {sentTo ? (
        <p className="text-[11px] text-stone-700 leading-relaxed">
          {t.unipdLinkSentTo.split('{email}').map((part, i, arr) => (
            <React.Fragment key={i}>{part}{i < arr.length - 1 && <strong>{sentTo}</strong>}</React.Fragment>
          ))}
        </p>
      ) : accountIsUniPd ? (
        <p className="text-[11px] text-stone-700 leading-relaxed">
          {t.unipdAccountUnverified}
        </p>
      ) : (
        <>
          <p className="text-[11px] text-stone-700 leading-relaxed">
            {t.unipdEnterEmail}
          </p>
          <div className="relative">
            <input
              type="email"
              value={unipdEmail}
              onChange={(e) => setUnipdEmail(e.target.value)}
              placeholder="ad.soyad@studenti.unipd.it"
              className="w-full min-h-[38px] pl-8 pr-2 text-xs border border-stone-300 rounded-lg bg-white outline-none focus:border-[#9b0014]"
            />
            <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </>
      )}

      {error && (
        <p className="text-[11px] text-rose-700 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      )}

      <div className="flex gap-2">
        {!sentTo && (
          <button
            type="button"
            onClick={handleSend}
            disabled={busy || (!accountIsUniPd && !isUniPdEmail(unipdEmail))}
            className="flex-1 bg-[#9b0014] hover:bg-[#830011] text-white font-bold px-3 py-2 rounded-lg transition cursor-pointer disabled:opacity-50"
          >
            {accountIsUniPd ? t.resendLink : t.sendVerifyLink}
          </button>
        )}
        {(sentTo || accountIsUniPd) && (
          <button
            type="button"
            onClick={handleCheck}
            disabled={busy}
            className="flex-1 bg-white border border-[#e3b3bb] text-[#7a0d1a] font-bold px-3 py-2 rounded-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {busy && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            {t.iVerified}
          </button>
        )}
      </div>
    </div>
  );
};
