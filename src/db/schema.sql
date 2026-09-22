-- ==============================================================================
-- PADOVA STUDENT HOUSING & ROOMMATE PLATFORM - POSTGRESQL DATABASE SCHEMA
-- Target DB: PostgreSQL 15+ / Cloud SQL for PostgreSQL
-- Compliant with Italian Tenancy Regulations (Canone Concordato / ESU Padova)
-- ==============================================================================

-- Enable UUID extension for cryptographic identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fast fuzzy search on addresses & faculties

-- ------------------------------------------------------------------------------
-- 1. ENUM TYPES
-- ------------------------------------------------------------------------------
CREATE TYPE room_type_enum AS ENUM (
    'Singola', 
    'Doppia', 
    'Posto Letto', 
    'Monolocale', 
    'Bilocale'
);

CREATE TYPE contract_type_enum AS ENUM (
    'Contratto per Studenti (Canone Concordato)',
    'Subentro (Resmi Sözleşme Devri)',
    'Contratto Transitorio (1-18 Ay)',
    'Standart 4+4 / 3+2 Yıllık'
);

CREATE TYPE fair_price_status_enum AS ENUM (
    'lower', 
    'average', 
    'higher'
);

CREATE TYPE verification_status_enum AS ENUM (
    'pending', 
    'approved', 
    'rejected'
);

CREATE TYPE user_role_enum AS ENUM (
    'student', 
    'flatmate_poster', 
    'landlord', 
    'moderator', 
    'admin'
);

-- ------------------------------------------------------------------------------
-- 2. USERS TABLE (UniPD Students & Landlords)
-- ------------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(180) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    phone VARCHAR(30),
    role user_role_enum DEFAULT 'student',
    
    -- UniPD Academic Credentials
    unipd_email VARCHAR(180) UNIQUE,
    matricola VARCHAR(20) UNIQUE, -- UniPD Student ID number
    faculty VARCHAR(150) NOT NULL DEFAULT 'Ingegneria / Engineering',
    year_of_study VARCHAR(50) DEFAULT '2. Yıl / 2nd Year',
    is_unipd_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    
    -- Roommate Lifestyle & Matching Preferences
    quiet_hours VARCHAR(100) DEFAULT '23:00 - 08:00',
    smoking_pref VARCHAR(100) DEFAULT 'Balkonda serbest / Balcony only',
    study_vibe VARCHAR(100) DEFAULT 'Sessiz ve kütüphane odaklı / Quiet & study-focused',
    cleanliness_rating VARCHAR(50) DEFAULT 'Haftalık temizlik çizelgesi / Weekly schedule',
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_unipd ON users(matricola, unipd_email);
CREATE INDEX idx_users_role ON users(role);

-- ------------------------------------------------------------------------------
-- 3. UNIPD CAMPUSES & CLINICAL CENTERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE unipd_campuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    faculty VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 4. HOUSING LISTINGS TABLE (Padova Student Housing)
-- ------------------------------------------------------------------------------
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poster_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL, -- Portello, Policlinico, Centro Storico, Arcella, etc.
    street_address VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL DEFAULT 45.4064,
    longitude DECIMAL(11, 8) NOT NULL DEFAULT 11.8768,
    distance_to_faculty VARCHAR(100) NOT NULL,
    
    -- Financials & ESU / Canone Concordato
    price_monthly INTEGER NOT NULL CHECK (price_monthly > 0),
    expenses_note VARCHAR(150) DEFAULT 'Faturalar ve aidat dahil / Bills included',
    fair_price_status fair_price_status_enum DEFAULT 'average',
    fair_price_text TEXT,
    
    -- Property & Lease Details
    room_type room_type_enum NOT NULL DEFAULT 'Singola',
    contract_type contract_type_enum NOT NULL DEFAULT 'Contratto per Studenti (Canone Concordato)',
    room_m2 NUMERIC(5, 2) NOT NULL DEFAULT 16.0,
    apartment_m2 NUMERIC(6, 2) NOT NULL DEFAULT 85.0,
    bathrooms NUMERIC(3, 1) NOT NULL DEFAULT 1.0,
    
    -- Verification Shields & Safety Badges
    has_video_tour BOOLEAN DEFAULT FALSE,
    video_title VARCHAR(255),
    video_url TEXT,
    is_student_card_verified BOOLEAN DEFAULT TRUE,
    is_admin_approved BOOLEAN DEFAULT TRUE,
    is_flagged_scam BOOLEAN DEFAULT FALSE,
    
    -- Matching & Community
    compatibility_score INTEGER DEFAULT 88 CHECK (compatibility_score BETWEEN 0 AND 100),
    compatibility_reason TEXT,
    confirmation_time_left VARCHAR(100) DEFAULT 'Bu ay sonuna kadar geçerli',
    description TEXT NOT NULL,
    views_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_listings_district ON listings(district);
CREATE INDEX idx_listings_price ON listings(price_monthly);
CREATE INDEX idx_listings_room_type ON listings(room_type);
CREATE INDEX idx_listings_contract ON listings(contract_type);
CREATE INDEX idx_listings_coords ON listings(latitude, longitude);
CREATE INDEX idx_listings_admin_status ON listings(is_admin_approved, is_flagged_scam);

-- ------------------------------------------------------------------------------
-- 5. LISTING IMAGES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE listing_images (
    id SERIAL PRIMARY KEY,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_cover BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_listing_images_listing ON listing_images(listing_id, display_order);

-- ------------------------------------------------------------------------------
-- 6. CURRENT FLATMATES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE flatmates (
    id SERIAL PRIMARY KEY,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL CHECK (age BETWEEN 17 AND 99),
    faculty VARCHAR(150) NOT NULL,
    year_of_study VARCHAR(50) NOT NULL,
    traits VARCHAR(255) NOT NULL,
    avatar_icon VARCHAR(50) DEFAULT 'GraduationCap',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_flatmates_listing ON flatmates(listing_id);

-- ------------------------------------------------------------------------------
-- 7. CONVERSATIONS & MULTILINGUAL DIRECT MESSAGES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    participant_one_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_two_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(200) NOT NULL,
    last_message_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_participants UNIQUE (participant_one_id, participant_two_id, listing_id)
);

CREATE TABLE direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    detected_language VARCHAR(5) DEFAULT 'en', -- 'it', 'en', 'tr', 'de', 'ru', 'hi'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation ON direct_messages(conversation_id, created_at);

-- ------------------------------------------------------------------------------
-- 8. STUDENT VERIFICATION QUEUE (Admin Moderation)
-- ------------------------------------------------------------------------------
CREATE TABLE student_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    matricola VARCHAR(20) NOT NULL,
    unipd_email VARCHAR(180) NOT NULL,
    document_photo_url TEXT NOT NULL,
    status verification_status_enum DEFAULT 'pending',
    reviewer_notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_verifications_status ON student_verifications(status);

-- ------------------------------------------------------------------------------
-- 9. USER SAVED FAVORITES (Many-to-Many)
-- ------------------------------------------------------------------------------
CREATE TABLE user_favorites (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, listing_id)
);

-- ------------------------------------------------------------------------------
-- 10. FAIR RENT AUDIT LOGS (Canone Concordato Compliance)
-- ------------------------------------------------------------------------------
CREATE TABLE fair_price_audits (
    id SERIAL PRIMARY KEY,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    audited_price INTEGER NOT NULL,
    district_average_price INTEGER NOT NULL,
    calmiere_max_price INTEGER NOT NULL,
    is_compliant BOOLEAN NOT NULL,
    notes TEXT,
    audited_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- END OF POSTGRESQL SCHEMA
-- ==============================================================================
