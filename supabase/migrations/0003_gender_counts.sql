-- Replace the free-text `gender_distribution` column with structured counts so the
-- listing detail view can render "2 Kadın, 1 Erkek" correctly in every site language
-- instead of freezing in whatever language the poster originally typed it in.

alter table public.listings
  drop column if exists gender_distribution,
  add column if not exists female_count int,
  add column if not exists male_count int;
