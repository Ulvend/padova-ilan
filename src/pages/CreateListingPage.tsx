import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Circle,
  Copy,
  Eye,
  Image as ImageIcon,
  Loader2,
  PartyPopper,
  Pencil,
  ShieldCheck,
  Share2,
  Video,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { HousingListing } from '../types';
import { WIZARD_TEXT, fill } from '../utils/wizardText';
import { uploadListingPhoto, describeUploadError } from '../services/storageService';
import { ListingCard } from '../components/ListingCard';
import { Card, InfoBox, SectionTitle } from '../components/ui/kit';
import {
  FormState,
  PhotoItem,
  STEP_COUNT,
  buildListing,
  clearDraft,
  createInitialForm,
  formFromListing,
  formatDate,
  isDraftMeaningful,
  loadDraft,
  saveDraft,
  validateStep,
  Errors,
} from '../components/wizard/formModel';
import { StepBasics, StepDetails, StepFlatmates, StepMedia, StepPrice } from '../components/wizard/steps';

const newId = () => `ph-${crypto.randomUUID()}`;

// Rota değişince (ör. yayın sonrası "video ekle") sihirbaz sıfırdan kurulsun.
export const CreateListingRoute: React.FC = () => {
  const loc = useLocation();
  const navigate = useNavigate();
  const { authReady, isLoggedIn, handleOpenAuthModal } = useApp();

  // Üye girişi olmadan sihirbaz açılmaz (adresi doğrudan yazsalar bile): ana sayfaya dönüp giriş penceresi açılır.
  useEffect(() => {
    if (authReady && !isLoggedIn) {
      navigate('/', { replace: true });
      handleOpenAuthModal('login', 'createListing');
    }
  }, [authReady, isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!authReady || !isLoggedIn) return null;
  return <CreateListingPage key={loc.pathname + loc.search} />;
};

const CreateListingPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const [searchParams] = useSearchParams();
  const {
    currentLang: lang,
    currentUser,
    myListings,
    handleAddListing,
    handleUpdateListing,
    setEditingListing,
  } = useApp();
  const w = WIZARD_TEXT[lang];

  const editing = useMemo(
    () => (editId ? myListings.find((l) => l.id === editId) ?? null : null),
    [editId, myListings]
  );
  const isEdit = Boolean(editId);

  const startStep = Math.min(STEP_COUNT, Math.max(1, Number(searchParams.get('adim')) || 1)) - 1;

  const [form, setForm] = useState<FormState>(() => (isEdit ? createInitialForm() : loadDraft()?.form ?? createInitialForm()));
  const [step, setStep] = useState(() => (isEdit ? startStep : loadDraft()?.step ?? 0));
  const [maxStep, setMaxStep] = useState(() => (isEdit ? STEP_COUNT - 1 : loadDraft()?.step ?? 0));
  const [attempted, setAttempted] = useState<Set<number>>(new Set());
  const [restored, setRestored] = useState(() => !isEdit && Boolean(loadDraft() && isDraftMeaningful(loadDraft()!.form)));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [done, setDone] = useState<{ id: string; listing: HousingListing } | null>(null);
  const [copied, setCopied] = useState(false);
  const hydratedEdit = useRef(false);
  const formRef = useRef(form);
  formRef.current = form;

  // Düzenleme: ilan yüklendiğinde formu bir kez doldur
  useEffect(() => {
    if (editing && !hydratedEdit.current) {
      hydratedEdit.current = true;
      setForm(formFromListing(editing));
    }
  }, [editing]);

  useEffect(() => () => setEditingListing(null), [setEditingListing]);

  const set = useCallback((patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch })), []);

  // ---------- Taslak otomatik kayıt (yalnızca yeni ilan) ----------
  useEffect(() => {
    if (isEdit || done || !isDraftMeaningful(form)) return;
    const timer = setTimeout(() => {
      saveDraft(form, step);
      setSavedAt(Date.now());
    }, 700);
    return () => clearTimeout(timer);
  }, [form, step, isEdit, done]);

  // ---------- Adım değişince: yukarı kaydır + ilk alana odaklan (dokunmatik olmayan cihazlarda) ----------
  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (window.matchMedia?.('(pointer: fine)').matches) {
      const el = document.querySelector<HTMLElement>('[data-autofocus]');
      setTimeout(() => el?.focus({ preventScroll: true }), 60);
    }
  }, [step]);

  const errors: Errors = attempted.has(step) ? validateStep(step, form, lang) : {};

  // ---------- Fotoğraf yükleme ----------
  const patchPhoto = (id: string, patch: Partial<PhotoItem>) =>
    setForm((f) => ({ ...f, photos: f.photos.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));

  const uploadOne = useCallback(
    async (item: PhotoItem): Promise<boolean> => {
      if (!item.file || !currentUser?.id) return false;
      patchPhoto(item.id, { status: 'uploading', progress: 5 });
      try {
        const url = await uploadListingPhoto(item.file, currentUser.id, (p) => patchPhoto(item.id, { progress: Math.round(p) }));
        patchPhoto(item.id, { url, status: 'done', progress: 100, file: undefined });
        return true;
      } catch (err) {
        console.error('Photo upload failed:', err);
        patchPhoto(item.id, { status: 'error', progress: 0 });
        setSubmitError(describeUploadError(err, lang));
        return false;
      }
    },
    [currentUser?.id]
  );

  const addFiles = (files: File[]) => {
    const items: PhotoItem[] = files.map((file) => ({
      id: newId(),
      url: URL.createObjectURL(file),
      status: 'uploading',
      progress: 0,
      file,
    }));
    setForm((f) => ({ ...f, photos: [...f.photos, ...items] }));
    // Sırayla yükle: hem ilerleme çubukları okunur kalır hem sunucu yükü düşer
    (async () => {
      for (const item of items) await uploadOne(item);
    })();
  };

  const addUrl = (url: string) =>
    setForm((f) => ({ ...f, photos: [...f.photos, { id: newId(), url, status: 'done', progress: 100 }] }));

  const removePhoto = (id: string) =>
    setForm((f) => {
      const target = f.photos.find((p) => p.id === id);
      if (target?.url.startsWith('blob:')) URL.revokeObjectURL(target.url);
      return { ...f, photos: f.photos.filter((p) => p.id !== id) };
    });

  const movePhoto = (from: number, to: number) =>
    setForm((f) => {
      if (to < 0 || to >= f.photos.length) return f;
      const photos = [...f.photos];
      const [item] = photos.splice(from, 1);
      photos.splice(to, 0, item);
      return { ...f, photos };
    });

  const retryPhoto = (id: string) => {
    const item = formRef.current.photos.find((p) => p.id === id);
    if (item) uploadOne(item);
  };

  // ---------- Gezinme ----------
  const goTo = (n: number) => {
    setStep(n);
    setMaxStep((m) => Math.max(m, n));
  };

  const next = () => {
    const errs = validateStep(step, form, lang);
    if (Object.keys(errs).length > 0) {
      setAttempted((s) => new Set(s).add(step));
      setTimeout(() => document.querySelector('[role="alert"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50);
      return;
    }
    if (step < STEP_COUNT - 1) goTo(step + 1);
  };

  const back = () => (step > 0 ? goTo(step - 1) : close());

  const close = () => navigate(isEdit ? '/ilanlarim' : '/');

  // ---------- Yayın ----------
  const publish = async () => {
    // Tüm adımları doğrula; hatalı ilk adıma dön
    for (let s = 0; s < STEP_COUNT - 1; s++) {
      if (Object.keys(validateStep(s, form, lang)).length > 0) {
        setAttempted((a) => new Set(a).add(s));
        setSubmitError(w.fixFields);
        goTo(s);
        return;
      }
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      // Başarısız fotoğrafları yeniden yükle
      let photos = formRef.current.photos;
      for (const p of photos.filter((p) => p.status === 'error')) {
        const ok = await uploadOne(p);
        if (!ok) throw new Error(w.uploadFailed);
      }
      photos = formRef.current.photos;
      if (photos.some((p) => p.status === 'uploading')) throw new Error(w.uploading + '…');

      const finalForm = { ...formRef.current, photos };
      const listing = buildListing(finalForm, {
        lang,
        user: currentUser,
        existing: editing,
        id: `PD-${crypto.randomUUID()}`,
      });

      if (editing) {
        const { id, poster, userId, createdAt, views, isStudentCardVerified, confirmationTimeLeft, ...updates } = listing;
        await handleUpdateListing(editing.id, updates);
      } else {
        await handleAddListing(listing);
        clearDraft();
      }
      setDone({ id: listing.id, listing });
    } catch (err) {
      const msg = (err as Error)?.message || '';
      setSubmitError(msg.startsWith('{') ? w.fixFields : msg || w.uploadFailed);
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Türetilmiş veri ----------
  const previewListing = useMemo(
    () => buildListing(form, { lang, user: currentUser, existing: editing, id: 'preview' }),
    [form, lang, currentUser, editing]
  );

  const stepTitles = [w.step1, w.step2, w.step3, w.step4, w.step5, w.step6];
  const stepHints = [w.step1Hint, w.step2Hint, w.step3Hint, w.step4Hint, w.step5Hint, w.step6Hint];
  const isLast = step === STEP_COUNT - 1;

  // Düzenlenecek ilan bulunamazsa (yanlış bağlantı / erişim yok) ilanlarıma dön
  useEffect(() => {
    if (!isEdit || editing) return;
    const timer = setTimeout(() => navigate('/ilanlarim', { replace: true }), 6000);
    return () => clearTimeout(timer);
  }, [isEdit, editing, navigate]);

  if (isEdit && !editing && !hydratedEdit.current) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
      </div>
    );
  }

  // ---------- Başarı ekranı ----------
  if (done) {
    const url = `${window.location.origin}/ilan/${done.id}`;
    const boosts = [
      !done.listing.hasVideoTour && {
        key: 'video',
        icon: <Video className="h-5 w-5" />,
        title: w.boostVideo,
        desc: w.boostVideoDesc,
        onClick: () => navigate(`/ilan-ver/${done.id}?adim=4`),
      },
      !currentUser?.studentIdVerified && {
        key: 'verify',
        icon: <ShieldCheck className="h-5 w-5" />,
        title: w.boostVerify,
        desc: w.boostVerifyDesc,
        onClick: () => navigate('/profil'),
      },
      done.listing.images.length < 3 && {
        key: 'photos',
        icon: <ImageIcon className="h-5 w-5" />,
        title: w.boostPhotos,
        desc: w.boostPhotosDesc,
        onClick: () => navigate(`/ilan-ver/${done.id}?adim=4`),
      },
    ].filter(Boolean) as { key: string; icon: React.ReactNode; title: string; desc: string; onClick: () => void }[];

    const copy = async () => {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        /* pano erişimi yoksa yoksay */
      }
    };
    const share = () => navigator.share?.({ title: done.listing.title, url }).catch(() => {});

    return (
      <div className="mx-auto max-w-xl px-4 py-10 sm:py-16">
        <div className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <PartyPopper className="h-8 w-8" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
            {isEdit ? w.successEdit : w.successTitle}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-stone-600">{w.successText}</p>
        </div>

        <Card className="mt-8">
          <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 p-1.5 pl-3.5">
            <span className="min-w-0 flex-1 truncate text-sm text-stone-700">{url}</span>
            <button
              type="button"
              onClick={copy}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-stone-900 px-4 text-sm font-semibold text-white hover:bg-black cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? w.copied : w.copyLink}
            </button>
          </div>
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              type="button"
              onClick={share}
              className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-stone-300 text-sm font-semibold text-stone-800 hover:bg-stone-50 cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
              {w.share}
            </button>
          )}
        </Card>

        {boosts.length > 0 && (
          <Card className="mt-4">
            <SectionTitle>{w.boostTitle}</SectionTitle>
            <ul className="space-y-2">
              {boosts.map((b) => (
                <li key={b.key}>
                  <button
                    type="button"
                    onClick={b.onClick}
                    className="flex min-h-[56px] w-full items-center gap-3 rounded-xl border border-stone-200 px-3.5 py-3 text-left transition hover:border-orange-300 hover:bg-orange-50 cursor-pointer"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">{b.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-stone-900">{b.title}</span>
                      <span className="block text-[13px] text-stone-500">{b.desc}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate(`/ilan/${done.id}`)}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-orange-600 px-6 text-sm font-bold text-white hover:bg-orange-700 active:bg-orange-800 cursor-pointer"
          >
            {w.viewListing}
          </button>
          <button
            type="button"
            onClick={() => navigate('/ilanlarim')}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-stone-300 bg-white px-6 text-sm font-semibold text-stone-800 hover:bg-stone-50 cursor-pointer"
          >
            {w.toMyListings}
          </button>
        </div>
      </div>
    );
  }

  const stepView = (() => {
    const base = { form, set, errors, lang };
    switch (step) {
      case 0:
        return <StepBasics {...base} />;
      case 1:
        return <StepPrice {...base} />;
      case 2:
        return <StepDetails {...base} />;
      case 3:
        return (
          <StepMedia
            {...base}
            onAddFiles={addFiles}
            onAddUrl={addUrl}
            onRemove={removePhoto}
            onMove={movePhoto}
            onRetry={retryPhoto}
          />
        );
      case 4:
        return <StepFlatmates {...base} />;
      default:
        return (
          <StepReview
            form={form}
            lang={lang}
            listing={previewListing}
            error={submitError}
            onEdit={goTo}
          />
        );
    }
  })();

  const previewCard = (
    <div inert className="select-none">
      <ListingCard
        listing={previewListing}
        isFavorite={false}
        onOpenPreviewModal={() => {}}
        currentLang={lang}
        layoutMode="double"
      />
    </div>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (isLast) publish();
        else next();
      }}
    >
      {/* Üst çubuk */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
          <button
            type="button"
            onClick={close}
            aria-label={w.close}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-stone-600 hover:bg-stone-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-orange-700">
              {isEdit ? w.editTitle : w.createTitle} · {fill(w.stepOf, { n: step + 1, total: STEP_COUNT })}
            </p>
            <p className="truncate text-base font-bold text-stone-900">{stepTitles[step]}</p>
          </div>
          {savedAt && !isEdit && (
            <span className="hidden items-center gap-1 text-[13px] text-stone-500 sm:inline-flex" role="status">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              {w.draftSaved}
            </span>
          )}
        </div>
        <nav aria-label={w.stepOf} className="mx-auto max-w-7xl px-4 pb-2.5 sm:px-6 lg:hidden">
          <ol className="flex gap-1.5">
            {stepTitles.map((title, i) => {
              const reachable = i <= maxStep;
              return (
                <li key={i} className="flex-1">
                  <button
                    type="button"
                    disabled={!reachable}
                    onClick={() => goTo(i)}
                    aria-current={i === step ? 'step' : undefined}
                    aria-label={title}
                    className="group block w-full cursor-pointer disabled:cursor-default"
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-colors ${
                        i === step ? 'bg-orange-600' : i < step || reachable ? 'bg-orange-300' : 'bg-stone-200'
                      }`}
                    />
                    <span
                      className={`mt-1 hidden truncate text-[12px] font-semibold sm:block ${
                        i === step ? 'text-stone-900' : reachable ? 'text-stone-500 group-hover:text-stone-800' : 'text-stone-300'
                      }`}
                    >
                      {title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-36 pt-6 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)_380px] lg:gap-10 lg:pb-28 lg:pt-10">
        {/* Dikey adım listesi (masaüstü) */}
        <nav aria-label={w.stepOf} className="hidden lg:block">
          <ol className="sticky top-28 space-y-1.5">
            {stepTitles.map((title, i) => {
              const reachable = i <= maxStep;
              const done = i < step;
              const current = i === step;
              return (
                <li key={i}>
                  <button
                    type="button"
                    disabled={!reachable}
                    onClick={() => goTo(i)}
                    aria-current={current ? 'step' : undefined}
                    className={`flex w-full items-center gap-3.5 rounded-2xl border px-3.5 py-3 text-left transition cursor-pointer disabled:cursor-default ${
                      current ? 'border-stone-200 bg-white' : 'border-transparent hover:bg-white/60 disabled:hover:bg-transparent'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                        done ? 'bg-emerald-700 text-white' : current ? 'bg-orange-600 text-white' : 'border border-stone-300 bg-white text-stone-500 font-bold'
                      }`}
                    >
                      {done ? <Check className="h-4 w-4 stroke-[3]" /> : i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-[15px] ${current ? 'font-extrabold text-stone-900' : reachable ? 'font-semibold text-stone-800' : 'font-semibold text-stone-500'}`}>{title}</span>
                      <span className="block truncate text-[13px] text-stone-500">{stepHints[i]}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="min-w-0">
          <div key={step} className="anim-rise">
            <h1 className="font-display text-[28px] font-black tracking-tight text-stone-900 sm:text-4xl">{stepTitles[step]}</h1>
            <p className="mt-2 text-base text-stone-600">{stepHints[step]}</p>

            <div className="mt-5 space-y-4">
              {restored && (
                <InfoBox
                  icon={<Pencil className="h-4 w-4" />}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>{w.draftRestored}</span>
                    <button
                      type="button"
                      onClick={() => {
                        clearDraft();
                        setForm(createInitialForm());
                        setStep(0);
                        setMaxStep(0);
                        setRestored(false);
                      }}
                      className="min-h-[36px] rounded-lg px-2 font-semibold text-stone-800 underline underline-offset-2 hover:text-orange-700 cursor-pointer"
                    >
                      {w.discardDraft}
                    </button>
                  </div>
                </InfoBox>
              )}
              {stepView}
            </div>
          </div>
        </div>

        {/* Canlı önizleme (masaüstü) */}
        <aside className="hidden lg:block">
          <div className="sticky top-32">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-stone-800">
              <Eye className="h-4 w-4 text-orange-600" />
              {w.livePreview}
            </p>
            {previewCard}
            <p className="mt-2 text-[13px] text-stone-500">{w.previewNote}</p>
          </div>
        </aside>
      </div>

      {/* Alt eylem çubuğu */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={back}
            className="inline-flex min-h-[48px] items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 hover:bg-stone-50 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{w.back}</span>
          </button>

          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex min-h-[48px] items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 hover:bg-stone-50 lg:hidden cursor-pointer"
          >
            <Eye className="h-4 w-4 text-orange-600" />
            {w.preview}
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="ml-auto inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700 active:scale-[0.99] active:bg-orange-800 disabled:bg-stone-400 sm:flex-none sm:min-w-[220px] cursor-pointer disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEdit ? w.saving : w.publishing}
              </>
            ) : isLast ? (
              <>
                <Check className="h-4 w-4" />
                {isEdit ? w.saveChanges : w.publish}
              </>
            ) : (
              w.next
            )}
          </button>
        </div>
      </div>

      {/* Mobil önizleme sayfası */}
      {previewOpen && (
        <div className="fixed inset-0 z-40 flex items-end bg-stone-900/50 lg:hidden" onClick={() => setPreviewOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={w.livePreview}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-stone-100 p-4 pb-8 anim-sheet"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-base font-bold text-stone-900">{w.livePreview}</p>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                aria-label={w.close}
                className="flex h-11 w-11 items-center justify-center rounded-full text-stone-600 hover:bg-stone-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {previewCard}
            <p className="mt-2 text-[13px] text-stone-500">{w.previewNote}</p>
          </div>
        </div>
      )}
    </form>
  );
};

// ---------- 6) Önizleme ve yayın ----------

const StepReview: React.FC<{
  form: FormState;
  lang: import('../types').Language;
  listing: HousingListing;
  error: string | null;
  onEdit: (step: number) => void;
}> = ({ form, lang, listing, error, onEdit }) => {
  const w = WIZARD_TEXT[lang];

  const rows: { step: number; label: string; value: string }[] = [
    { step: 0, label: w.step1, value: `${listing.title} · ${listing.streetAddress}` },
    {
      step: 1,
      label: w.step2,
      value: `€${listing.price}${listing.expenses ? ` · ${listing.expenses}` : ''} · ${
        form.isImmediate ? w.moveInNow : formatDate(form.startDate, lang)
      }${form.endDate ? ` → ${formatDate(form.endDate, lang)}` : ''}`,
    },
    { step: 2, label: w.step3, value: `${listing.roomM2} m² · ${listing.apartmentM2} m² · ${listing.bathrooms} ${w.bathroomsLabel.toLowerCase()}` },
    { step: 3, label: w.step4, value: `${fill(w.photoCount, { n: form.photos.length })}${form.hasVideoTour ? ` · ${w.videoTitle}` : ''}` },
    { step: 4, label: w.step5, value: `${form.totalHousemates} · ${form.femaleCount} ${w.women} / ${form.maleCount} ${w.men}` },
  ];

  const checks = [
    { ok: form.photos.length >= 3, label: w.checkPhotos },
    { ok: form.hasVideoTour && Boolean(listing.hasVideoTour), label: w.checkVideo },
    { ok: form.description.trim().length >= 40, label: w.checkDescription },
    { ok: Boolean(form.endDate), label: w.checkDates },
  ];
  const score = checks.filter((c) => c.ok).length;

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle hint={w.reviewHint}>{w.reviewTitle}</SectionTitle>
        <dl className="divide-y divide-stone-100">
          {rows.map((r) => (
            <div key={r.step} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <dt className="text-[13px] font-medium text-stone-500">{r.label}</dt>
                <dd className="mt-0.5 break-words text-sm font-semibold text-stone-900">{r.value}</dd>
              </div>
              <button
                type="button"
                onClick={() => onEdit(r.step)}
                className="inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-lg px-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-50 cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
                {w.edit}
              </button>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <SectionTitle
          action={<span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[13px] font-bold text-orange-800">{score}/{checks.length}</span>}
        >
          {w.checklistTitle}
        </SectionTitle>
        <ul className="grid gap-2 sm:grid-cols-2">
          {checks.map((c) => (
            <li key={c.label} className={`flex items-center gap-2 text-sm ${c.ok ? 'font-semibold text-stone-900' : 'text-stone-500'}`}>
              {c.ok ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" /> : <Circle className="h-4.5 w-4.5 text-stone-300" />}
              {c.label}
            </li>
          ))}
        </ul>
      </Card>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
          {error}
        </div>
      )}
    </div>
  );
};
