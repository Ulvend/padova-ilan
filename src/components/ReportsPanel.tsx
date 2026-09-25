import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flag, Check, X, ExternalLink, Trash2, Ban, RotateCcw } from 'lucide-react';
import type { BanResult, Report, ReportCategory, ReportStatus } from '../services/supabaseService';

interface ReportsPanelProps {
  reports: Report[];
  loading: boolean;
  onChangeStatus: (id: string, status: ReportStatus) => Promise<void>;
  bannedIds: string[];
  // Yönetici hesapları banlanamaz (sunucu da reddeder); düğme gösterilmez.
  adminIds: string[];
  onDeleteListing: (listingId: string) => Promise<boolean>;
  onBanUser: (userId: string, reason: string, reportId: string) => Promise<BanResult>;
  onUnbanUser: (userId: string) => Promise<void>;
}

// Admin paneli Türkçe çalışır (panelin diğer sekmeleriyle tutarlı).
const CATEGORY_LABEL: Record<ReportCategory, string> = {
  scam: 'Dolandırıcılık şüphesi',
  fake_photo: 'Sahte / yanıltıcı fotoğraf',
  inappropriate: 'Uygunsuz içerik',
  spam: 'Spam / tekrar eden ilan',
  other: 'Diğer',
};

const STATUS_LABEL: Record<ReportStatus, string> = {
  pending: 'Bekliyor',
  reviewed: 'İncelendi',
  dismissed: 'Reddedildi',
};

const STATUS_STYLE: Record<ReportStatus, string> = {
  pending: 'bg-amber-100 text-amber-900 border-amber-300',
  reviewed: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  dismissed: 'bg-stone-100 text-stone-600 border-stone-300',
};

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export const ReportsPanel: React.FC<ReportsPanelProps> = ({
  reports,
  loading,
  onChangeStatus,
  bannedIds,
  adminIds,
  onDeleteListing,
  onBanUser,
  onUnbanUser,
}) => {
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Geri alınamaz işlemler: silme iki tıklamayla, ban gerekçe formuyla onaylanır.
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [banFormId, setBanFormId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');

  const run = async (id: string, action: () => Promise<void>, failMessage: string) => {
    setBusyId(id);
    setError(null);
    try {
      await action();
    } catch (err) {
      console.warn('Report action error:', err);
      setError(failMessage);
    } finally {
      setBusyId(null);
    }
  };

  const deleteListing = (r: Report) => {
    if (!r.targetListingId) return;
    if (confirmDeleteId !== r.id) {
      setConfirmDeleteId(r.id);
      return;
    }
    setConfirmDeleteId(null);
    run(r.id, async () => {
      const ok = await onDeleteListing(r.targetListingId!);
      if (!ok) throw new Error('delete_failed');
    }, 'İlan silinemedi. Lütfen tekrar deneyin.');
  };

  const openBanForm = (r: Report) => {
    setConfirmDeleteId(null);
    setBanFormId(r.id);
    setBanReason(`${CATEGORY_LABEL[r.category]}${r.reason ? `: ${r.reason}` : ''}`.slice(0, 500));
  };

  const banUser = (r: Report, userId: string) =>
    run(r.id, async () => {
      const result = await onBanUser(userId, banReason.trim(), r.id);
      if (result === 'cannot_ban_admin') {
        setError('Yönetici hesapları banlanamaz.');
        return;
      }
      if (result === 'cannot_ban_self') {
        setError('Kendinizi banlayamazsınız.');
        return;
      }
      setBanFormId(null);
      setBanReason('');
    }, 'Kullanıcı banlanamadı. Lütfen tekrar deneyin.');

  const visible = filter === 'pending' ? reports.filter((r) => r.status === 'pending') : reports;

  const change = (id: string, status: ReportStatus) =>
    run(id, () => onChangeStatus(id, status), 'Durum güncellenemedi. Lütfen tekrar deneyin.');

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <div>
          <h2 className="text-sm md:text-base font-bold text-stone-900 flex items-center gap-2">
            <Flag className="w-4 h-4 text-rose-600" />
            İlan Şikayetleri
          </h2>
          <p className="text-xs text-stone-500">Kullanıcıların bildirdiği ilanlar. Şikayet edenin kimliği yalnızca yöneticilere görünür.</p>
        </div>
        <div className="flex gap-1.5 text-xs font-bold">
          {(['pending', 'all'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition ${
                filter === f ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {f === 'pending' ? 'Bekleyenler' : 'Tümü'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-xs text-stone-500 py-6 text-center">Yükleniyor…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-stone-500 py-8 text-center">
          {filter === 'pending' ? 'Bekleyen şikayet yok.' : 'Henüz şikayet yok.'}
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <div key={r.id} className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="bg-rose-100 text-rose-900 border border-rose-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    {CATEGORY_LABEL[r.category]}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${STATUS_STYLE[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>
                <span className="text-[11px] text-stone-400">{formatDate(r.createdAt)}</span>
              </div>

              {r.targetListingId ? (
                <Link
                  to={`/ilan/${r.targetListingId}`}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-stone-900 hover:text-orange-700"
                >
                  {r.targetListingTitle || r.targetListingId}
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <span className="text-sm font-bold text-stone-900">Kullanıcı: {r.targetUserId}</span>
              )}

              {r.reason && <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-wrap">{r.reason}</p>}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-[10px] text-stone-400 font-mono">Şikayet eden: {r.reporterId.slice(0, 8)}…</span>
                {r.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => change(r.id, 'reviewed')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      İncelendi
                    </button>
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => change(r.id, 'dismissed')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 disabled:bg-stone-100 border border-stone-300 text-stone-700 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reddet
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => change(r.id, 'pending')}
                    className="text-xs font-semibold text-stone-500 hover:text-stone-800 underline cursor-pointer"
                  >
                    Yeniden bekleyene al
                  </button>
                )}
              </div>

              {/* Yaptırımlar: ilanı sil / ilanı veren (ya da şikayet edilen) kullanıcıyı banla */}
              {(() => {
                const ownerId = r.targetUserId ?? r.targetListingOwnerId;
                const isBanned = Boolean(ownerId && bannedIds.includes(ownerId));
                const isAdminTarget = Boolean(ownerId && adminIds.includes(ownerId));
                if (!r.targetListingId && !ownerId) return null;
                return (
                  <div className="border-t border-stone-200 pt-2.5 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {r.targetListingId && (
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => deleteListing(r)}
                          onBlur={() => setConfirmDeleteId((id) => (id === r.id ? null : id))}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50 transition ${
                            confirmDeleteId === r.id
                              ? 'bg-rose-600 hover:bg-rose-700 text-white'
                              : 'bg-white hover:bg-rose-50 border border-rose-300 text-rose-700'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {confirmDeleteId === r.id ? 'Emin misiniz? İlanı kalıcı sil' : 'İlanı Sil'}
                        </button>
                      )}

                      {ownerId && !isAdminTarget && !isBanned && banFormId !== r.id && (
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => openBanForm(r)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          {r.targetListingId ? 'İlanı Veren Kullanıcıyı Banla' : 'Kullanıcıyı Banla'}
                        </button>
                      )}

                      {ownerId && isBanned && (
                        <>
                          <span className="flex items-center gap-1 bg-rose-100 text-rose-900 border border-rose-300 text-[10px] font-bold px-2.5 py-1 rounded-full">
                            <Ban className="w-3 h-3" />
                            Kullanıcı banlı
                          </span>
                          <button
                            type="button"
                            disabled={busyId === r.id}
                            onClick={() => run(r.id, () => onUnbanUser(ownerId), 'Ban kaldırılamadı. Lütfen tekrar deneyin.')}
                            className="flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-800 underline cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Banı Kaldır
                          </button>
                        </>
                      )}

                      {ownerId && isAdminTarget && (
                        <span className="text-[11px] text-stone-500">Yönetici hesabı banlanamaz.</span>
                      )}
                    </div>

                    {ownerId && banFormId === r.id && (
                      <div className="p-3 bg-white border border-rose-200 rounded-xl space-y-2.5">
                        <p className="text-xs text-stone-700 leading-relaxed">
                          <strong className="text-rose-800">Banlanan kullanıcı:</strong> giriş yapamaz, yeni ilan veremez ve mesaj gönderemez;
                          yayındaki tüm ilanları arşivlenir ve bu kullanıcıyla ilgili bekleyen şikayetler incelendi olarak kapanır.
                          Ban daha sonra kaldırılabilir.
                        </p>
                        <label className="block space-y-1">
                          <span className="text-[11px] font-semibold text-stone-600">Ban gerekçesi (yalnızca yöneticiler görür)</span>
                          <textarea
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value.slice(0, 500))}
                            rows={2}
                            className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white text-stone-900 outline-none focus:border-stone-500 resize-y"
                          />
                        </label>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setBanFormId(null)}
                            className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 text-xs font-bold rounded-lg cursor-pointer"
                          >
                            Vazgeç
                          </button>
                          <button
                            type="button"
                            disabled={busyId === r.id}
                            onClick={() => banUser(r, ownerId)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-stone-300 text-white text-xs font-bold rounded-lg cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            {busyId === r.id ? 'Banlanıyor…' : 'Banla'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
