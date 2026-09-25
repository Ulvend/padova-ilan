import React from 'react';
import {
  Bike,
  Building2,
  BedDouble,
  Bed,
  Cigarette,
  Car,
  Dog,
  Flame,
  Home,
  Layers,
  Mars,
  Users,
  Venus,
  Video,
  Wifi,
  Wind,
  WashingMachine,
  CalendarRange,
  ArrowUpDown,
  FileImage,
  Trash2,
  Zap,
} from 'lucide-react';
import { ContractType, Language, RoomType } from '../../types';
import { TRANSLATIONS } from '../../utils/translations';
import { LANG_LOCALE, WIZARD_TEXT, fill } from '../../utils/wizardText';
import { Card, Chip, Field, HelpTip, Segmented, SectionTitle, Stepper, inputClass } from '../ui/kit';
import { DateRangePicker, monthsBetween } from '../ui/DateRangePicker';
import { LocationField } from './LocationField';
import { PriceGauge } from './PriceGauge';
import { PhotoUploader } from './PhotoUploader';
import { Errors, FormState, formatDate, FLOOR_MAX, FLOOR_MIN } from './formModel';
import type { EnergyClass } from '../../types';
import { EnergyClassBadge } from '../EnergyClassBadge';

const ENERGY_CLASSES: EnergyClass[] = ['A4', 'A3', 'A2', 'A1', 'B', 'C', 'D', 'E', 'F', 'G', 'pending'];

export interface StepProps {
  form: FormState;
  set: (patch: Partial<FormState>) => void;
  errors: Errors;
  lang: Language;
}

// ---------- 1) Temel bilgi ----------

export const StepBasics: React.FC<StepProps> = ({ form, set, errors, lang }) => {
  const w = WIZARD_TEXT[lang];
  const t = TRANSLATIONS[lang] || TRANSLATIONS.tr;
  const rooms: { value: RoomType; label: string; icon: React.ReactNode }[] = [
    { value: 'Singola', label: t.roomSingola, icon: <Bed className="h-4 w-4" /> },
    { value: 'Doppia', label: t.roomDoppia, icon: <BedDouble className="h-4 w-4" /> },
    { value: 'Monolocale', label: t.roomMonolocale, icon: <Home className="h-4 w-4" /> },
    { value: 'Bilocale', label: t.roomBilocale, icon: <Building2 className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>{w.roomTypeQ}</SectionTitle>
        <div className="flex flex-wrap gap-2" role="group" aria-label={w.roomTypeQ}>
          {rooms.map((r) => (
            <Chip key={r.value} selected={form.roomType === r.value} onClick={() => set({ roomType: r.value })} icon={r.icon}>
              {r.label}
            </Chip>
          ))}
        </div>

        <Field
          className="mt-5"
          label={w.titleLabel}
          htmlFor="wiz-title"
          required
          help={w.titleHelp}
          error={errors.title}
        >
          <input
            id="wiz-title"
            data-autofocus
            type="text"
            value={form.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder={w.titlePlaceholder}
            maxLength={90}
            className={inputClass(Boolean(errors.title))}
          />
        </Field>
      </Card>

      <Card>
        <LocationField
          lang={lang}
          value={{
            streetAddress: form.streetAddress,
            district: form.district,
            lat: form.lat,
            lng: form.lng,
          }}
          onChange={(p) => set(p)}
          error={errors.streetAddress}
        />
      </Card>
    </div>
  );
};

// ---------- 2) Fiyat ve sözleşme ----------

export const StepPrice: React.FC<StepProps> = ({ form, set, errors, lang }) => {
  const w = WIZARD_TEXT[lang];
  const t = TRANSLATIONS[lang] || TRANSLATIONS.tr;
  const locale = LANG_LOCALE[lang];
  const months = monthsBetween(form.startDate, form.endDate);
  const contracts: { value: ContractType; label: string }[] = [
    { value: 'Contratto per Studenti (Canone Concordato)', label: t.contractCanone },
    { value: 'Subentro (Resmi Sözleşme Devri)', label: t.contractSubentro },
    { value: 'Contratto Transitorio (1-18 Ay)', label: t.contractTransitorio },
    { value: 'Standart 4+4 / 3+2 Yıllık', label: t.contractStandard },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>{w.rentLabel}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={w.rentLabel} htmlFor="wiz-price" required error={errors.price}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-stone-500">€</span>
              <input
                id="wiz-price"
                data-autofocus
                type="number"
                inputMode="numeric"
                min={0}
                value={form.price}
                onChange={(e) => set({ price: e.target.value })}
                placeholder="420"
                className={`${inputClass(Boolean(errors.price))} pl-8 pr-16 text-lg font-bold`}
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-stone-500">{w.perMonth}</span>
            </div>
          </Field>

          <Field label={w.expensesLabel}>
            <Segmented
              ariaLabel={w.expensesLabel}
              value={form.expensesIncluded ? 'in' : 'out'}
              onChange={(v) => set({ expensesIncluded: v === 'in' })}
              options={[
                { value: 'in', label: w.expensesIncluded },
                { value: 'out', label: w.expensesExtra },
              ]}
            />
            {!form.expensesIncluded && (
              <div className="relative mt-2">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-500">€</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  aria-label={w.expensesAmount}
                  value={form.expensesAmount}
                  onChange={(e) => set({ expensesAmount: e.target.value })}
                  placeholder={w.expensesAmount}
                  className={`${inputClass(Boolean(errors.expensesAmount))} pl-8`}
                />
              </div>
            )}
          </Field>
        </div>

        <div className="mt-4">
          <PriceGauge price={Number(form.price) || 0} district={form.district} roomType={form.roomType} lang={lang} />
        </div>
      </Card>

      <Card>
        <SectionTitle>{w.contractLabel}</SectionTitle>
        <label htmlFor="wiz-contract" className="sr-only">{w.contractLabel}</label>
        <select
          id="wiz-contract"
          value={form.contractType}
          onChange={(e) => set({ contractType: e.target.value as ContractType })}
          className={inputClass()}
        >
          {contracts.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Card>

      <Card>
        <SectionTitle hint={w.datesHelp}>{w.datesLabel}</SectionTitle>

        <div className="flex flex-col gap-5 md:flex-row md:items-start">
          <div>
            <DateRangePicker
              start={form.startDate}
              end={form.endDate}
              locale={locale}
              hintStart={w.pickStartFirst}
              hintEnd={w.pickEnd}
              prevLabel={t.prevMonth}
              nextLabel={t.nextMonth}
              onChange={(s, e) => set({ startDate: s, endDate: e })}
            />
          </div>

          <div className="grid flex-1 grid-cols-2 gap-3 self-start">
            <div className="rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3">
              <p className="text-[13px] font-medium text-stone-500">{w.startLabel}</p>
              <p className="mt-0.5 text-sm font-bold text-stone-900">
                {form.startDate ? formatDate(form.startDate, lang) : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3">
              <p className="text-[13px] font-medium text-stone-500">{w.endLabel}</p>
              <p className="mt-0.5 text-sm font-bold text-stone-900">{form.endDate ? formatDate(form.endDate, lang) : '—'}</p>
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-3">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-orange-900">
                <CalendarRange className="h-4 w-4 text-orange-600" />
                {w.duration}
              </span>
              <span className="text-base font-extrabold text-orange-700" aria-live="polite">
                {months ? fill(months === 1 ? w.monthsUnit_one : w.monthsUnit_other, { n: months }) : '—'}
              </span>
            </div>
            {(form.startDate || form.endDate) && (
              <button
                type="button"
                onClick={() => set({ startDate: '', endDate: '' })}
                className="col-span-2 min-h-[44px] self-start text-left text-sm font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                {w.clearDates}
              </button>
            )}
            {errors.dates && (
              <p role="alert" className="col-span-2 text-[13px] font-medium text-rose-600">
                {errors.dates}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

// ---------- 3) Ev detayları ----------

export const StepDetails: React.FC<StepProps> = ({ form, set, errors, lang }) => {
  const w = WIZARD_TEXT[lang];
  const t = TRANSLATIONS[lang] || TRANSLATIONS.tr;

  return (
    <div className="space-y-5">
      <Card>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={w.roomAreaLabel} htmlFor="wiz-room-m2" required error={errors.roomM2}>
            <input
              id="wiz-room-m2"
              data-autofocus
              type="number"
              inputMode="numeric"
              min={1}
              value={form.roomM2}
              onChange={(e) => set({ roomM2: e.target.value })}
              placeholder="14"
              className={inputClass(Boolean(errors.roomM2))}
            />
          </Field>
          <Field label={w.aptAreaLabel} htmlFor="wiz-apt-m2" required error={errors.apartmentM2}>
            <input
              id="wiz-apt-m2"
              type="number"
              inputMode="numeric"
              min={1}
              value={form.apartmentM2}
              onChange={(e) => set({ apartmentM2: e.target.value })}
              placeholder="90"
              className={inputClass(Boolean(errors.apartmentM2))}
            />
          </Field>
          <Field label={w.bathroomsLabel}>
            <Stepper value={form.bathrooms} min={1} max={6} label={w.bathroomsLabel} onChange={(n) => set({ bathrooms: n })} />
          </Field>
        </div>
      </Card>

      <Card>
        <SectionTitle>{t.buildingInfoTitle}</SectionTitle>
        <div className="space-y-5">
          <div>
            <div className="mb-2 flex items-center gap-1">
              <span className="text-sm font-semibold text-stone-800">{t.energyClassLabel}</span>
              <span className="text-rose-600" aria-hidden="true">*</span>
              <HelpTip>{t.energyClassHelp}</HelpTip>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t.energyClassLabel}>
              {ENERGY_CLASSES.map((c) => (
                <Chip
                  key={c}
                  selected={form.energyClass === c}
                  onClick={() => set({ energyClass: c })}
                  icon={c === 'pending' ? undefined : <Zap className="h-4 w-4" />}
                >
                  {c === 'pending' ? t.energyClassPending : c}
                </Chip>
              ))}
            </div>
            {form.energyClass && form.energyClass !== 'pending' && (
              <div className="mt-2">
                <EnergyClassBadge value={form.energyClass} pendingLabel={t.energyClassPending} />
              </div>
            )}
            {errors.energyClass && <p role="alert" className="mt-1.5 text-[13px] font-medium text-rose-600">{errors.energyClass}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.floorLabel} htmlFor="wiz-floor" optionalText={w.optional} hint={t.floorHint} error={errors.floor}>
              <input
                id="wiz-floor"
                type="number"
                inputMode="numeric"
                min={FLOOR_MIN}
                max={FLOOR_MAX}
                step={1}
                value={form.floor}
                onChange={(e) => set({ floor: e.target.value })}
                placeholder="2"
                className={inputClass(Boolean(errors.floor))}
              />
            </Field>
            <div>
              <p className="mb-1.5 text-sm font-semibold text-stone-800">{t.elevatorLabel}</p>
              <Segmented
                ariaLabel={t.elevatorLabel}
                value={form.hasElevator ? 'yes' : 'no'}
                onChange={(v) => set({ hasElevator: v === 'yes' })}
                options={[
                  { value: 'no', label: t.elevatorNo, icon: <ArrowUpDown className="h-4 w-4 opacity-50" /> },
                  { value: 'yes', label: t.elevatorYes, icon: <ArrowUpDown className="h-4 w-4" /> },
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>{w.amenitiesLabel}</SectionTitle>

        <div className="space-y-5">
          <div>
            <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-stone-500">{w.groupComfort}</p>
            <div className="flex flex-wrap gap-2">
              <Chip selected={form.hasWifi} onClick={() => set({ hasWifi: !form.hasWifi })} icon={<Wifi className="h-4 w-4" />}>
                {t.wifiLabel}
              </Chip>
              <Chip
                selected={form.hasAirConditioning}
                onClick={() => set({ hasAirConditioning: !form.hasAirConditioning })}
                icon={<Wind className="h-4 w-4" />}
              >
                {t.airConditioningLabel}
              </Chip>
              <Chip
                selected={form.hasWashingMachine}
                onClick={() => set({ hasWashingMachine: !form.hasWashingMachine })}
                icon={<WashingMachine className="h-4 w-4" />}
              >
                {t.washingMachineLabel}
              </Chip>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-stone-500">{w.heatingLabel}</p>
            <Segmented
              ariaLabel={w.heatingLabel}
              value={form.heatingType}
              onChange={(v) => set({ heatingType: v })}
              options={[
                { value: 'autonomo', label: t.heatingAutonomo, icon: <Flame className="h-4 w-4" /> },
                { value: 'centralizzato', label: t.heatingCentralizzato, icon: <Building2 className="h-4 w-4" /> },
              ]}
            />
          </div>

          <div>
            <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-stone-500">{w.groupMobility}</p>
            <div className="flex flex-wrap gap-2">
              <Chip
                selected={form.hasBikeParking}
                onClick={() => set({ hasBikeParking: !form.hasBikeParking })}
                icon={<Bike className="h-4 w-4" />}
              >
                {t.bikeParkingLabel}
              </Chip>
              <Chip selected={form.hasParking} onClick={() => set({ hasParking: !form.hasParking })} icon={<Car className="h-4 w-4" />}>
                {t.parkingLabel}
              </Chip>
            </div>
            {(form.hasBikeParking || form.hasParking) && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {form.hasBikeParking && (
                  <input
                    type="text"
                    aria-label={t.bikeParkingLabel}
                    value={form.bikeParkingDetails}
                    onChange={(e) => set({ bikeParkingDetails: e.target.value })}
                    placeholder={w.bikeDetailsPlaceholder}
                    className={inputClass()}
                  />
                )}
                {form.hasParking && (
                  <input
                    type="text"
                    aria-label={t.parkingLabel}
                    value={form.parkingDetails}
                    onChange={(e) => set({ parkingDetails: e.target.value })}
                    placeholder={w.parkingDetailsPlaceholder}
                    className={inputClass()}
                  />
                )}
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-stone-500">{w.groupRules}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Segmented
                ariaLabel={t.smokingRuleLabel}
                value={form.smokingAllowed ? 'yes' : 'no'}
                onChange={(v) => set({ smokingAllowed: v === 'yes' })}
                options={[
                  { value: 'no', label: w.smokingNo, icon: <Cigarette className="h-4 w-4 opacity-50" /> },
                  { value: 'yes', label: w.smokingOk, icon: <Cigarette className="h-4 w-4" /> },
                ]}
              />
              <Segmented
                ariaLabel={t.petsRuleLabel}
                value={form.petsAllowed ? 'yes' : 'no'}
                onChange={(v) => set({ petsAllowed: v === 'yes' })}
                options={[
                  { value: 'no', label: w.petsNo, icon: <Dog className="h-4 w-4 opacity-50" /> },
                  { value: 'yes', label: w.petsOk, icon: <Dog className="h-4 w-4" /> },
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <Field
          label={w.descriptionLabel}
          htmlFor="wiz-desc"
          optionalText={w.optional}
          hint={w.descriptionHelp}
        >
          <textarea
            id="wiz-desc"
            rows={5}
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder={w.descriptionPlaceholder}
            className={`${inputClass()} resize-y`}
          />
        </Field>
      </Card>
    </div>
  );
};

// ---------- 4) Fotoğraf / video ----------

interface MediaProps extends StepProps {
  onAddFiles: (files: File[]) => void;
  onAddUrl: (url: string) => void;
  onRemove: (id: string) => void;
  onMove: (from: number, to: number) => void;
  onRetry: (id: string) => void;
  onFloorPlanFile: (file: File) => void;
  onFloorPlanRemove: () => void;
  floorPlanBusy: boolean;
  floorPlanError: string | null;
}

export const StepMedia: React.FC<MediaProps> = ({
  form,
  set,
  errors,
  lang,
  onAddFiles,
  onAddUrl,
  onRemove,
  onMove,
  onRetry,
  onFloorPlanFile,
  onFloorPlanRemove,
  floorPlanBusy,
  floorPlanError,
}) => {
  const w = WIZARD_TEXT[lang];
  const t = TRANSLATIONS[lang] || TRANSLATIONS.tr;
  const planInput = React.useRef<HTMLInputElement>(null);
  const [showAngles, setShowAngles] = React.useState(Boolean(form.angles.desk || form.angles.kitchen || form.angles.balcony));

  return (
    <div className="space-y-5">
      <Card>
        <PhotoUploader
          photos={form.photos}
          w={w}
          error={errors.photos}
          onAddFiles={onAddFiles}
          onAddUrl={onAddUrl}
          onRemove={onRemove}
          onMove={onMove}
          onRetry={onRetry}
        />
      </Card>

      <Card>
        <SectionTitle>{t.floorPlanTitle}</SectionTitle>
        <p className="text-[13px] text-stone-500">{t.floorPlanHelp}</p>
        <input
          ref={planInput}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFloorPlanFile(file);
            e.target.value = '';
          }}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {form.floorPlanUrl && (
            <a href={form.floorPlanUrl} target="_blank" rel="noopener noreferrer" className="block">
              <img src={form.floorPlanUrl} alt={t.floorPlanTitle} className="h-28 w-40 rounded-lg border border-stone-200 bg-white object-contain" loading="lazy" />
            </a>
          )}
          <button
            type="button"
            disabled={floorPlanBusy}
            onClick={() => planInput.current?.click()}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 hover:bg-stone-100 disabled:opacity-50 cursor-pointer"
          >
            <FileImage className="h-4 w-4" />
            {floorPlanBusy ? t.floorPlanUploading : form.floorPlanUrl ? t.floorPlanReplace : t.floorPlanUpload}
          </button>
          {form.floorPlanUrl && !floorPlanBusy && (
            <button
              type="button"
              onClick={onFloorPlanRemove}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              {t.floorPlanRemove}
            </button>
          )}
        </div>
        {floorPlanError && <p role="alert" className="mt-2 text-[13px] font-medium text-rose-600">{floorPlanError}</p>}
      </Card>

      <Card>
        <SectionTitle
          action={
            <Chip selected={form.hasVideoTour} onClick={() => set({ hasVideoTour: !form.hasVideoTour })} icon={<Video className="h-4 w-4" />}>
              {w.videoToggle}
            </Chip>
          }
        >
          {w.videoTitle}
        </SectionTitle>
        <p className="text-[13px] text-stone-500">{w.videoDesc}</p>

        {form.hasVideoTour && (
          <div className="mt-4 space-y-4">
            <Field label={w.videoUrlLabel} htmlFor="wiz-video" hint={w.videoUrlHelp}>
              <input
                id="wiz-video"
                type="url"
                value={form.videoUrl}
                onChange={(e) => set({ videoUrl: e.target.value })}
                placeholder="https://…/oda-turu.mp4"
                className={inputClass()}
              />
            </Field>

            {form.videoUrl.trim() && (
              <video key={form.videoUrl} src={form.videoUrl} controls playsInline className="h-44 w-full rounded-xl bg-black object-cover" />
            )}

            <button
              type="button"
              onClick={() => setShowAngles((s) => !s)}
              aria-expanded={showAngles}
              className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              <Layers className="h-4 w-4" />
              {w.moreAngles}
            </button>
            {showAngles && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={w.angleDesk} htmlFor="wiz-a-desk">
                  <input id="wiz-a-desk" type="url" value={form.angles.desk || ''} onChange={(e) => set({ angles: { ...form.angles, desk: e.target.value } })} placeholder="https://…/desk.mp4" className={inputClass()} />
                </Field>
                <Field label={w.angleKitchen} htmlFor="wiz-a-kitchen">
                  <input id="wiz-a-kitchen" type="url" value={form.angles.kitchen || ''} onChange={(e) => set({ angles: { ...form.angles, kitchen: e.target.value } })} placeholder="https://…/kitchen.mp4" className={inputClass()} />
                </Field>
                <Field label={w.angleBalcony} htmlFor="wiz-a-balcony" className="sm:col-span-2">
                  <input id="wiz-a-balcony" type="url" value={form.angles.balcony || ''} onChange={(e) => set({ angles: { ...form.angles, balcony: e.target.value } })} placeholder="https://…/balcony.mp4" className={inputClass()} />
                </Field>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

// ---------- 5) Ev arkadaşları ----------

export const StepFlatmates: React.FC<StepProps> = ({ form, set, lang }) => {
  const w = WIZARD_TEXT[lang];
  const known = form.femaleCount + form.maleCount;
  const total = form.totalHousemates;

  const setTotal = (n: number) => {
    const patch: Partial<FormState> = { totalHousemates: n };
    // Dağılım toplamı aşmasın
    if (form.femaleCount + form.maleCount > n) {
      patch.femaleCount = Math.min(form.femaleCount, n);
      patch.maleCount = Math.min(form.maleCount, n - patch.femaleCount);
    }
    set(patch);
  };

  return (
    <div className="space-y-5">
      <Card>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={w.housematesLabel} hint={w.housematesHelp}>
            <Stepper value={total} min={1} max={10} label={w.housematesLabel} onChange={setTotal} />
          </Field>

          <div>
            <div className="mb-1.5 flex items-center gap-1">
              <span className="text-sm font-semibold text-stone-800">{w.distributionLabel}</span>
              <HelpTip>{w.distributionHelp}</HelpTip>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Venus className="h-5 w-5 text-orange-600" aria-hidden="true" />
                <Stepper
                  value={form.femaleCount}
                  min={0}
                  max={Math.max(0, total - form.maleCount)}
                  label={w.women}
                  onChange={(n) => set({ femaleCount: n })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Mars className="h-5 w-5 text-stone-700" aria-hidden="true" />
                <Stepper
                  value={form.maleCount}
                  min={0}
                  max={Math.max(0, total - form.femaleCount)}
                  label={w.men}
                  onChange={(n) => set({ maleCount: n })}
                />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1" aria-hidden="true">
              {Array.from({ length: total }, (_, i) => (
                <span
                  key={i}
                  className={`h-2 flex-1 rounded-full ${i < form.femaleCount ? 'bg-orange-500' : i < known ? 'bg-stone-700' : 'bg-stone-200'}`}
                />
              ))}
            </div>
            <p className="mt-1.5 text-[13px] text-stone-500">
              {form.femaleCount} {w.women} · {form.maleCount} {w.men}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-semibold text-stone-800">{w.genderPrefLabel}</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label={w.genderPrefLabel}>
              <Chip selected={form.genderPreference === 'any'} onClick={() => set({ genderPreference: 'any' })} icon={<Users className="h-4 w-4" />}>
                {w.genderAny}
              </Chip>
              <Chip selected={form.genderPreference === 'female_only'} onClick={() => set({ genderPreference: 'female_only' })} icon={<Venus className="h-4 w-4" />}>
                {w.genderFemale}
              </Chip>
              <Chip selected={form.genderPreference === 'male_only'} onClick={() => set({ genderPreference: 'male_only' })} icon={<Mars className="h-4 w-4" />}>
                {w.genderMale}
              </Chip>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-stone-800">{w.occupantLabel}</p>
            <Segmented
              ariaLabel={w.occupantLabel}
              value={form.occupantType}
              onChange={(v) => set({ occupantType: v })}
              options={[
                { value: 'students_only', label: w.occStudents },
                { value: 'mixed', label: w.occMixed },
                { value: 'workers_only', label: w.occWorkers },
              ]}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
