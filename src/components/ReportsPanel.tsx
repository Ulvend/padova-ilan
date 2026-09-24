import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flag, Check, X, ExternalLink } from 'lucide-react';
import type { Report, ReportCategory, ReportStatus } from '../services/supabaseService';

interface ReportsPanelProps {
  reports: Report[];
  loading: boolean;
  onChangeStatus: (id: string, status: ReportStatus) => Promise<void>;
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

export const ReportsPanel: React.FC<ReportsPanelProps> = ({ reports, loading, onChangeStatus }) => {
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = filter === 'pending' ? reports.filter((r) => r.status === 'pending') : reports;

  const change = async (id: string, status: ReportStatus) => {
    setBusyId(id);
    setError(null);
    try {
      await onChangeStatus(id, status);
    } catch (err) {
      console.warn('Report status error:', err);
      setError('Durum güncellenemedi. Lütfen tekrar deneyin.');
    } finally {
      setBusyId(null);
    }
  };

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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
