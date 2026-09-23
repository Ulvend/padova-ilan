-- Padova Student Housing — initial schema, replacing Firestore.
-- Mirrors firestore.rules' authorization logic as Postgres RLS + triggers.

create extension if not exists pgcrypto;

-- ============================================================
-- Tables first (helper functions below reference these).
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) <= 100),
  username text not null check (char_length(username) <= 50),
  faculty text not null default '' check (char_length(faculty) <= 150),
  bio text not null default '' check (char_length(bio) <= 500),
  photo_url text not null default '' check (char_length(photo_url) <= 2048),
  unipd_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_private (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text check (char_length(email) <= 320),
  phone text check (char_length(phone) <= 30),
  saved_listing_ids text[] not null default '{}' check (array_length(saved_listing_ids, 1) is null or array_length(saved_listing_ids, 1) <= 500),
  updated_at timestamptz not null default now()
);

create table public.admins (
  uid uuid primary key references auth.users(id) on delete cascade,
  note text check (char_length(note) <= 200),
  granted_by uuid not null,
  created_at timestamptz not null default now()
);

create table public.listings (
  id text primary key check (id ~ '^[a-zA-Z0-9_-]{1,128}$'),
  user_id uuid references auth.users(id) on delete set null,
  title text not null check (char_length(title) > 0 and char_length(title) <= 150),
  district text not null,
  street_address text not null default '',
  distance_to_faculty text not null default '',
  price numeric not null check (price > 0 and price < 10000),
  expenses text not null default '',
  fair_price_status text not null default 'average',
  fair_price_text text not null default '',
  room_type text not null,
  contract_type text not null,
  contract_start_date text,
  contract_start_iso text,
  contract_duration text,
  has_video_tour boolean not null default false,
  video_title text,
  video_url text,
  video_angles jsonb,
  is_student_card_verified boolean not null default false,
  compatibility_score numeric not null default 0,
  compatibility_reason text not null default '',
  current_flatmates jsonb not null default '[]',
  total_housemates int,
  gender_preference text,
  gender_distribution text,
  occupant_type text,
  smoking_allowed boolean,
  pets_allowed boolean,
  heating_type text,
  has_air_conditioning boolean,
  has_washing_machine boolean,
  has_wifi boolean,
  has_bike_parking boolean,
  bike_parking_details text,
  has_parking boolean,
  parking_details text,
  room_m2 numeric not null default 0,
  apartment_m2 numeric not null default 0,
  bathrooms numeric not null default 1,
  confirmation_time_left text not null default '',
  description text not null default '' check (char_length(description) <= 5000),
  poster jsonb not null,
  images text[] not null default '{}' check (array_length(images, 1) is null or array_length(images, 1) <= 20),
  views int not null default 0,
  lat numeric,
  lng numeric,
  is_archived boolean not null default false,
  rented_at text,
  rented_price numeric,
  archive_reason text,
  tenant_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade check (recipient_id <> sender_id),
  text text not null check (char_length(text) > 0 and char_length(text) <= 2000),
  listing_id text,
  subject text check (char_length(subject) <= 200),
  read boolean not null default false,
  created_at bigint not null
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) <= 120),
  message text not null check (char_length(message) <= 500),
  type text not null check (type in ('message', 'listing', 'security', 'tenant', 'system', 'admin')),
  read boolean not null default false,
  created_at timestamptz not null default now(),
  timestamp bigint not null,
  link_view text,
  link_id text
);

-- ============================================================
-- Helper functions (mirror isVerified/isUniPd/isAdmin/isSuperAdmin)
-- ============================================================

create or replace function public.email_verified()
returns boolean language sql stable security definer set search_path = public as $$
  select email_confirmed_at is not null from auth.users where id = auth.uid();
$$;

create or replace function public.current_user_email()
returns text language sql stable security definer set search_path = public as $$
  select lower(email) from auth.users where id = auth.uid();
$$;

create or replace function public.is_unipd_verified()
returns boolean language sql stable security definer set search_path = public as $$
  select public.email_verified() and public.current_user_email() ~ '^[^@]+@(studenti\.)?unipd\.it$';
$$;

-- Keep this list in sync with src/config.ts SUPERADMIN_EMAILS.
create or replace function public.is_superadmin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.email_verified() and public.current_user_email() = 'cnkborasimsek@gmail.com';
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_superadmin() or exists(select 1 from public.admins where uid = auth.uid());
$$;

-- ============================================================
-- 1. Profiles — RLS
-- ============================================================

alter table public.profiles enable row level security;

create policy "profiles_select_signed_in" on public.profiles
  for select using (auth.uid() is not null);

create policy "profiles_insert_owner" on public.profiles
  for insert with check (auth.uid() = id and unipd_verified = public.is_unipd_verified());

create policy "profiles_update_owner" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and unipd_verified = public.is_unipd_verified());

create policy "profiles_delete_admin" on public.profiles
  for delete using (public.is_admin());

alter table public.profile_private enable row level security;

create policy "profile_private_select_owner_or_admin" on public.profile_private
  for select using (auth.uid() = user_id or public.is_admin());

create policy "profile_private_upsert_owner" on public.profile_private
  for insert with check (auth.uid() = user_id);

create policy "profile_private_update_owner" on public.profile_private
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "profile_private_delete_owner" on public.profile_private
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 2. Admin grants — row existence = admin. Only superadmin manages.
-- ============================================================

alter table public.admins enable row level security;

create policy "admins_select_owner_or_admin" on public.admins
  for select using (auth.uid() = uid or public.is_admin());

create policy "admins_insert_superadmin" on public.admins
  for insert with check (public.is_superadmin());

create policy "admins_update_superadmin" on public.admins
  for update using (public.is_superadmin()) with check (public.is_superadmin());

create policy "admins_delete_superadmin" on public.admins
  for delete using (public.is_superadmin());

-- ============================================================
-- 3. Listings — RLS
-- ============================================================

alter table public.listings enable row level security;

create policy "listings_select_public" on public.listings
  for select using (true);

create policy "listings_insert_verified_owner" on public.listings
  for insert with check (
    public.email_verified()
    and user_id = auth.uid()
    and is_student_card_verified = public.is_unipd_verified()
    and (poster->>'id') = auth.uid()::text
    and (poster->>'verifiedUniPD')::boolean = public.is_unipd_verified()
  );

-- Owners can't change userId/isStudentCardVerified/poster/createdAt (ownerProtectedKeys()).
create or replace function public.enforce_listing_owner_protected_keys()
returns trigger language plpgsql as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if new.user_id is distinct from old.user_id
    or new.is_student_card_verified is distinct from old.is_student_card_verified
    or new.poster is distinct from old.poster
    or new.created_at is distinct from old.created_at then
    raise exception 'Cannot modify protected listing fields as owner';
  end if;
  return new;
end;
$$;

create trigger listings_protect_owner_fields
  before update on public.listings
  for each row execute function public.enforce_listing_owner_protected_keys();

create policy "listings_update_admin_or_owner" on public.listings
  for update using (
    public.is_admin() or (public.email_verified() and user_id = auth.uid())
  ) with check (
    public.is_admin() or (public.email_verified() and user_id = auth.uid())
  );

create policy "listings_delete_owner_or_admin" on public.listings
  for delete using (user_id = auth.uid() or public.is_admin());

-- ============================================================
-- 4. Messages — RLS
-- ============================================================

alter table public.messages enable row level security;

create policy "messages_select_participant" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "messages_insert_verified_sender" on public.messages
  for insert with check (public.email_verified() and sender_id = auth.uid() and read = false);

-- Recipient may only flip `read` to true; nothing else can change.
create or replace function public.enforce_message_read_only_update()
returns trigger language plpgsql as $$
begin
  if auth.uid() <> old.recipient_id then
    raise exception 'Only the recipient can update a message';
  end if;
  if new.sender_id is distinct from old.sender_id
    or new.recipient_id is distinct from old.recipient_id
    or new.text is distinct from old.text
    or new.listing_id is distinct from old.listing_id
    or new.subject is distinct from old.subject
    or new.created_at is distinct from old.created_at
    or new.read is distinct from true then
    raise exception 'Only the read field may be set to true';
  end if;
  return new;
end;
$$;

create trigger messages_read_only_update
  before update on public.messages
  for each row execute function public.enforce_message_read_only_update();

create policy "messages_update_recipient" on public.messages
  for update using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

create policy "messages_delete_sender" on public.messages
  for delete using (auth.uid() = sender_id);

-- ============================================================
-- 5. Notifications — RLS
-- ============================================================

alter table public.notifications enable row level security;

create policy "notifications_select_owner" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notifications_insert_owner_or_admin" on public.notifications
  for insert with check (auth.uid() = user_id or public.is_admin());

create or replace function public.enforce_notification_read_only_update()
returns trigger language plpgsql as $$
begin
  if new.user_id is distinct from old.user_id
    or new.title is distinct from old.title
    or new.message is distinct from old.message
    or new.type is distinct from old.type
    or new.created_at is distinct from old.created_at
    or new.timestamp is distinct from old.timestamp
    or new.link_view is distinct from old.link_view
    or new.link_id is distinct from old.link_id then
    raise exception 'Only the read field may change';
  end if;
  return new;
end;
$$;

create trigger notifications_read_only_update
  before update on public.notifications
  for each row execute function public.enforce_notification_read_only_update();

create policy "notifications_update_owner" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notifications_delete_owner" on public.notifications
  for delete using (auth.uid() = user_id);

-- ============================================================
-- Realtime: expose postgres_changes for the tables the app subscribes to.
-- ============================================================

alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.admins;
alter publication supabase_realtime add table public.listings;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
