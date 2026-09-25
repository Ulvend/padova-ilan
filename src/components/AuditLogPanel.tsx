import React, { useCallback, useEffect, useState } from 'react';
import { ScrollText, RefreshCw } from 'lucide-react';
import { getAdminAuditLog, type AuditLogEntry } from '../services/supabaseService';

const PAGE_SIZE = 50;

const ACTION_LABELS: Record<string, { label: string; tone: string }> = {
  admin_granted: { label: 'Admin yetkisi verildi', tone: 'bg-amber-100 text-amber-800' },
  admin_revoked: { label: 'Admin yetkisi alındı', tone: 'bg-amber-100 text-amber-800' },
  user_banned: { label: 'Kullanıcı banlandı', tone: 'bg-rose-100 text-rose-700' },
  user_unbanned: { label: 'Ban kaldırıldı', tone: 'bg-emerald-100 text-emerald-700' },
  listing_deleted: { label: 'İlan silindi', tone: 'bg-rose-100 text-rose-700' },
  listing_updated: { label: 'İlan güncellendi', tone: 'bg-sky-100 text-sky-700' },
  report_status_changed: { label: 'Şikayet kararı', tone: 'bg-violet-100 text-violet-700' },
  photo_flag_reviewed: { label: 'Fotoğraf incelemesi', tone: 'bg-violet-100 text-violet-700' },
};

const FIELD_LABELS: Record<string, string> = {
  is_archived: 'Arşiv',
  archive_reason: 'Arşiv nedeni',
  has_video_tour: 'Video rozeti',
  is_student_card_verified: 'Doğrulama rozeti',
  price: 'Fiyat',
  title: 'Başlık',
};

const REPORT_STATUS_LABELS: Record<string, string> = { pending: 'Bekliyor', reviewed: 'İncelendi', dismissed: 'Reddedildi' };

const show = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'evet' : 'hayır';
  return String(value);
};

const Person: React.FC<{ id?: string; name?: string; username?: string }> = ({ id, name, username }) => {
  if (!id) return <span className="text-stone-400">Sistem / SQL</span>;
  return (
    <>
      {name && <span className="block font-bold text-stone-900">{name}</span>}
      {username && <span className="block text-orange-600 font-semibold">@{username}</span>}
      <code className="block font-mono text-[10px] text-stone-400 break-all">{id}</code>
    </>
  );
};

const Target: React.FC<{ entry: AuditLogEntry }> = ({ entry }) => {
  if (entry.targetType === 'user') return <Person id={entry.targetId} name={entry.targetName} username={entry.targetUsername} />;
  const title = typeof entry.details.title === 'string' ? entry.details.title : undefined;
  return (
    <>
      <span className="block text-stone-500 text-[10px] uppercase tracking-wider">{entry.targetType === 'listing' ? 'İlan' : entry.targetType === 'photo_flag' ? 'Fotoğraf işareti' : 'Şikayet'}</span>
      {title && <span className="block font-bold text-stone-900">{title}</span>}
      <code className="block font-mono text-[10px] text-stone-400 break-all">{entry.targetId ?? '—'}</code>
    </>
  );
};

const Details: React.FC<{ entry: AuditLogEntry }> = ({ entry }) => {
  const d = entry.details;
  switch (entry.action) {
    case 'user_banned':
      return <span className="whitespace-pre-wrap">{show(d.reason)}</span>;
    case 'listing_deleted':
      return <span>İlan sahibi: <code className="font-mono text-[10px]">{show(d.owner_id)}</code></span>;
    case 'listing_updated': {
      const changed = (d.changed ?? {}) as Record<string, { from?: unknown; to?: unknown }>;
      const entries = Object.entries(changed);
      if (entries.length === 0) return <span className="text-stone-400">—</span>;
      return (
        <ul className="space-y-0.5">
          {entries.map(([field, change]) => (
            <li key={field}>
              <span className="font-semibold">{FIELD_LABELS[field] ?? field}:</span> {show(change.from)} → {show(change.to)}
            </li>
          ))}
        </ul>
      );
    }
    case 'report_status_changed':
    case 'photo_flag_reviewed':
      return <span>{REPORT_STATUS_LABELS[String(d.from)] ?? show(d.from)} → {REPORT_STATUS_LABELS[String(d.to)] ?? show(d.to)}</span>;
    case 'admin_granted':
    case 'admin_revoked':
      return <span>{d.role ? `Rol: ${show(d.role)}` : ''}{d.note ? ` · ${show(d.note)}` : ''}</span>;
    default:
      return <span className="text-stone-400">—</span>;
  }
};

/** Admin işlem kaydı. Yalnızca superadmin'e gösterilir; sunucu (RLS) diğer kullanıcılara zaten boş döner. */
export const AuditLogPanel: React.FC = () => {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const page = await getAdminAuditLog(PAGE_SIZE);
      setEntries(page);
      setHasMore(page.length === PAGE_SIZE);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = async () => {
    const last = entries[entries.length - 1];
    if (!last) return;
    setLoadingMore(true);
    try {
      const page = await getAdminAuditLog(PAGE_SIZE, last.id);
      setEntries((prev) => [...prev, ...page]);
      setHasMore(page.length === PAGE_SIZE);
    } catch {
      setError(true);
    } finally {
      setLoadingMore(false);
    }
  };

  const visible = filter === 'all' ? entries : entries.filter((e) => e.action === filter);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 md:p-6 space-y-4">
      <div className="border-b border-stone-100 pb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-stone-700" />
            <h2 className="text-base font-bold text-stone-900">Admin İşlem Kaydı</h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Yetki verme/alma, ban, başkasının ilanını silme/değiştirme ve şikayet kararları burada saklanır. Kayıtlar değiştirilemez ve silinemez; yalnızca ana admin görür.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="İşlem türüne göre filtrele"
            className="h-9 rounded-lg border border-stone-300 bg-white px-2 text-xs font-semibold text-stone-800"
          >
            <option value="all">Tüm işlemler</option>
            {Object.entries(ACTION_LABELS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 text-xs font-bold text-stone-800 hover:bg-stone-100 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-stone-500 py-6 text-center">Yükleniyor…</p>
      ) : error ? (
        <p role="alert" className="text-sm text-rose-700 py-8 text-center">İşlem kaydı yüklenemedi. Lütfen tekrar deneyin.</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-stone-500 py-8 text-center">Kayıt yok.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Zaman</th>
                <th className="p-3">İşlemi yapan</th>
                <th className="p-3">İşlem</th>
                <th className="p-3">Hedef</th>
                <th className="p-3">Ayrıntı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {visible.map((entry) => {
                const meta = ACTION_LABELS[entry.action] ?? { label: entry.action, tone: 'bg-stone-100 text-stone-700' };
                return (
                  <tr key={entry.id} className="hover:bg-stone-50/80 transition align-top">
                    <td className="p-3 text-stone-500 whitespace-nowrap">{new Date(entry.createdAt).toLocaleString('tr-TR')}</td>
                    <td className="p-3"><Person id={entry.actorId} name={entry.actorName} username={entry.actorUsername} /></td>
                    <td className="p-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.tone}`}>{meta.label}</span>
                    </td>
                    <td className="p-3"><Target entry={entry} /></td>
                    <td className="p-3 text-stone-700 max-w-xs"><Details entry={entry} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && !loading && !error && (
        <div className="text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex h-9 items-center rounded-lg border border-stone-300 bg-white px-4 text-xs font-bold text-stone-800 hover:bg-stone-100 disabled:opacity-50 cursor-pointer"
          >
            {loadingMore ? 'Yükleniyor…' : 'Daha eski kayıtları göster'}
          </button>
        </div>
      )}
    </div>
  );
};
