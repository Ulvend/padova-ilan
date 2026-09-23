-- Replace the free-text contract "duration" preset with an actual start–end date range,
-- matching the "Kontrat Başlangıç Tarihi" form's move from a type dropdown to two calendars.

alter table public.listings
  drop column if exists contract_duration,
  add column if not exists contract_end_date text,
  add column if not exists contract_end_iso text;
