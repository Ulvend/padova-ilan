import React, { useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Link as LinkIcon, Loader2, RotateCw, Star, Trash2, UploadCloud } from 'lucide-react';
import { WizardText, fill } from '../../utils/wizardText';
import { PhotoItem } from './formModel';
import { HelpTip, inputClass } from '../ui/kit';
import { isAllowedImageType } from '../../services/storageService';

interface PhotoUploaderProps {
  photos: PhotoItem[];
  w: WizardText;
  error?: string | null;
  onAddFiles: (files: File[]) => void;
  onAddUrl: (url: string) => void;
  onRemove: (id: string) => void;
  onMove: (from: number, to: number) => void;
  onRetry: (id: string) => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ photos, w, error, onAddFiles, onAddUrl, onRemove, onMove, onRetry }) => {
  const input = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [url, setUrl] = useState('');
  const [showUrl, setShowUrl] = useState(false);

  const takeFiles = (list: FileList | null) => {
    const files = Array.from(list ?? []).filter((f) => isAllowedImageType(f.type));
    if (files.length) onAddFiles(files);
  };

  const submitUrl = () => {
    const v = url.trim();
    if (!v) return;
    onAddUrl(v);
    setUrl('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-stone-800">
          {w.photosLabel} <span className="text-orange-600" aria-hidden="true">*</span>
        </span>
        <HelpTip>{w.photosTips}</HelpTip>
        {photos.length > 0 && (
          <span className="ml-auto rounded-full bg-stone-100 px-2.5 py-0.5 text-[13px] font-semibold text-stone-700">
            {fill(w.photoCount, { n: photos.length })}
          </span>
        )}
      </div>

      {/* Sürükle-bırak alanı */}
      <div
        onDragOver={(e) => {
          if (dragIndex === null) {
            e.preventDefault();
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (dragIndex !== null) return;
          e.preventDefault();
          setDragOver(false);
          takeFiles(e.dataTransfer.files);
        }}
        className={`rounded-2xl border-2 border-dashed px-4 py-7 text-center transition ${
          dragOver ? 'border-orange-500 bg-orange-50' : error ? 'border-rose-300 bg-rose-50/40' : 'border-stone-300 bg-stone-50 hover:border-stone-400'
        }`}
      >
        <input ref={input} type="file" multiple accept="image/png, image/jpeg, image/webp" className="hidden" onChange={(e) => {
          takeFiles(e.target.files);
          e.target.value = '';
        }} />
        <UploadCloud className={`mx-auto h-8 w-8 ${dragOver ? 'text-orange-600' : 'text-stone-400'}`} />
        <p className="mt-2 text-sm font-semibold text-stone-800">{w.dropHere}</p>
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="mt-0.5 min-h-[44px] rounded-lg px-3 text-sm font-semibold text-orange-700 underline-offset-2 hover:underline cursor-pointer"
        >
          {w.orBrowse}
        </button>
      </div>
      {error && <p role="alert" className="text-[13px] font-medium text-rose-600">{error}</p>}
      <p className="text-[13px] text-stone-500">{w.photosHelp}</p>

      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p, i) => (
            <li
              key={p.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragEnter={() => dragIndex !== null && setOverIndex(i)}
              onDragOver={(e) => dragIndex !== null && e.preventDefault()}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              onDrop={(e) => {
                if (dragIndex === null) return;
                e.preventDefault();
                e.stopPropagation();
                if (dragIndex !== i) onMove(dragIndex, i);
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={`group relative aspect-4/3 overflow-hidden rounded-xl border bg-stone-100 transition ${
                i === 0 ? 'border-orange-500 ring-2 ring-orange-500/25' : 'border-stone-200'
              } ${overIndex === i && dragIndex !== i ? 'scale-[0.97] ring-2 ring-orange-400' : ''} ${dragIndex === i ? 'opacity-40' : ''}`}
            >
              <img src={p.url} alt="" className="h-full w-full object-cover" draggable={false} loading="lazy" />

              {i === 0 && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-orange-600 px-2 py-0.5 text-[12px] font-bold text-white shadow-xs">
                  <Star className="h-3 w-3 fill-current" />
                  {w.cover}
                </span>
              )}

              {p.status === 'uploading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-stone-900/55 px-4 text-white" role="status">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/30">
                    <div className="h-full bg-orange-500 transition-all" style={{ width: `${Math.max(6, p.progress)}%` }} />
                  </div>
                  <span className="text-[12px] font-semibold">{w.uploading} %{p.progress}</span>
                </div>
              )}
              {p.status === 'error' && (
                <button
                  type="button"
                  onClick={() => onRetry(p.id)}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-rose-900/70 text-white cursor-pointer"
                >
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-[12px] font-semibold">{w.uploadFailed}</span>
                  <span className="inline-flex items-center gap-1 text-[12px] underline">
                    <RotateCw className="h-3 w-3" />
                    {w.retry}
                  </span>
                </button>
              )}

              {/* Eylemler: dokunmatikte de erişilebilsin diye her zaman görünür küçük çubuk */}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-linear-to-t from-stone-900/70 to-transparent p-1.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label={w.moveLeft}
                    disabled={i === 0}
                    onClick={() => onMove(i, i - 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-stone-800 hover:bg-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={w.moveRight}
                    disabled={i === photos.length - 1}
                    onClick={() => onMove(i, i + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-stone-800 hover:bg-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  {i > 0 && (
                    <button
                      type="button"
                      aria-label={w.makeCover}
                      title={w.makeCover}
                      onClick={() => onMove(i, 0)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-amber-600 hover:bg-white cursor-pointer"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={w.remove}
                  onClick={() => onRemove(p.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-rose-600 hover:bg-white cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowUrl((s) => !s)}
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
        >
          <LinkIcon className="h-4 w-4" />
          {w.addByUrl}
        </button>
        {showUrl && (
          <div className="mt-1 flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitUrl();
                }
              }}
              placeholder={w.urlPlaceholder}
              className={inputClass()}
            />
            <button
              type="button"
              onClick={submitUrl}
              disabled={!url.trim()}
              className="min-h-[44px] shrink-0 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white hover:bg-black disabled:bg-stone-300 cursor-pointer disabled:cursor-not-allowed"
            >
              {w.add}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
