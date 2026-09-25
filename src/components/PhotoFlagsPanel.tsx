import React, { useState } from 'react';
import { ImageOff, Ban, CheckCircle2, XCircle } from 'lucide-react';
import type { BanResult, PhotoDuplicateFlag, PhotoFlagStatus } from '../services/supabaseService';

interface PhotoFlagsPanelProps {
  flags: PhotoDuplicateFlag[];
  loading: boolean;
  bannedIds: string[];
  onStatus: (id: number, status: PhotoFlagStatus) => Promise<void>;
  onBan: (userId: string, reason: string) => Promise<BanResult>;
}

const Person: React.FC<{ label: string; id: string; name?: string; username?: string }> = ({ label, id, name, username }) => (
  <div className="min-w-0">
    <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">{label}</span>
    <span className="block truncate text-xs font-bold text-stone-900">{name || '—'}</span>
    {username && <span className="block truncate text-xs font-semibold text-orange-600">@{username}</span>}
    <code className="block break-all font-mono text-[10px] text-stone-400">{id}</code>
  </div>
);

/** Başka bir kullanıcının fotoğrafına çok benzeyen yüklemeler; admin yan yana bakıp karar verir. */
export const PhotoFlagsPanel: React.FC<PhotoFlagsPanelProps> = ({ flags, loading, bannedIds, onStatus, onBan }) => {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const run = async (id: number, task: () => Promise<void>) => {
    setBusyId(id);
    setMessage(null);
    try {
      await task();
    } catch (err) {
      console.error('Photo flag action error:', err);
      setMessage('İşlem tamamlanamadı. Lütfen tekrar deneyin.');
    } finally {
      setBusyId(null);
    }
  };

  const ban = (flag: PhotoDuplicateFlag) =>
    run(flag.id, async () => {
      if (!window.confirm('Bu kullanıcı banlanacak ve tüm ilanları yayından kaldırılacak. Devam edilsin mi?')) return;
      const result = await onBan(flag.ownerId, 'Başka bir kullanıcıya ait fotoğraf kullanımı (çalıntı fotoğraf)');
      if (result === 'cannot_ban_admin') return setMessage('Yöneticiler banlanamaz.');
      if (result === 'cannot_ban_self') return setMessage('Kendinizi banlayamazsınız.');
      await onStatus(flag.id, 'reviewed');
    });

  return (
    <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-6">
      <div className="border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <ImageOff className="h-5 w-5 text-amber-600" />
          <h2 className="text-base font-bold text-stone-900">Şüpheli Fotoğraflar</h2>
        </div>
        <p className="mt-0.5 text-xs text-stone-500">
          Yeni yüklenen fotoğraf, başka bir kullanıcının fotoğrafına çok benziyorsa (yeniden boyutlandırılmış veya aynalanmış olsa bile) burada listelenir.
          Aynı evi paylaşan ev arkadaşları ya da emlakçılar da eşleşebilir; yan yana bakıp karar verin. Yükleme engellenmez, yükleyene uyarı gösterilir.
        </p>
      </div>

      {message && <p role="alert" className="text-xs font-medium text-rose-600">{message}</p>}

      {loading ? (
        <p className="py-6 text-center text-xs text-stone-500">Yükleniyor…</p>
      ) : flags.length === 0 ? (
        <p className="py-8 text-center text-sm text-stone-500">İncelenecek şüpheli fotoğraf yok.</p>
      ) : (
        <ul className="space-y-4">
          {flags.map((flag) => {
            const busy = busyId === flag.id;
            const banned = bannedIds.includes(flag.ownerId);
            return (
              <li key={flag.id} className="rounded-xl border border-stone-200 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <figure className="space-y-2">
                    <a href={flag.url} target="_blank" rel="noopener noreferrer" className="block">
                      <img src={flag.url} alt="Yeni yüklenen fotoğraf" className="aspect-4/3 w-full rounded-lg border border-amber-300 object-cover" loading="lazy" />
                    </a>
                    <Person label="Yeni yükleyen" id={flag.ownerId} name={flag.ownerName} username={flag.ownerUsername} />
                  </figure>
                  <figure className="space-y-2">
                    <a href={flag.matchedUrl} target="_blank" rel="noopener noreferrer" className="block">
                      <img src={flag.matchedUrl} alt="Daha önce yüklenen fotoğraf" className="aspect-4/3 w-full rounded-lg border border-stone-200 object-cover" loading="lazy" />
                    </a>
                    <Person label="Daha önceki sahip" id={flag.matchedOwnerId} name={flag.matchedOwnerName} username={flag.matchedOwnerUsername} />
                  </figure>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3">
                  <span className="text-[11px] text-stone-500">
                    Benzerlik farkı: <strong>{flag.distance}</strong>/64 bit · {new Date(flag.createdAt).toLocaleString('tr-TR')}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(flag.id, () => onStatus(flag.id, 'dismissed'))}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-800 hover:bg-stone-100 disabled:opacity-50 cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Yanlış alarm
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(flag.id, () => onStatus(flag.id, 'reviewed'))}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-800 hover:bg-stone-100 disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      İncelendi
                    </button>
                    <button
                      type="button"
                      disabled={busy || banned}
                      onClick={() => ban(flag)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      {banned ? 'Banlı' : 'Yeni yükleyeni banla'}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
