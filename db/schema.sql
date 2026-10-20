-- Same file runs on local PGlite and on hosted Postgres (Supabase). Idempotent.

CREATE TABLE IF NOT EXISTS packages (
  id               SERIAL PRIMARY KEY,
  slug             TEXT NOT NULL UNIQUE,
  code             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  category         TEXT NOT NULL DEFAULT 'family',
  type             TEXT NOT NULL DEFAULT 'customized',
  badge            TEXT,
  days             INTEGER NOT NULL,
  nights           INTEGER NOT NULL,
  overview         TEXT NOT NULL DEFAULT '',
  highlights       JSONB NOT NULL DEFAULT '[]',
  hero_image       TEXT,
  gallery          JSONB NOT NULL DEFAULT '[]',
  region           TEXT NOT NULL DEFAULT 'India',
  country          TEXT NOT NULL DEFAULT 'India',
  state            TEXT,
  cities           JSONB NOT NULL DEFAULT '[]',
  tags             JSONB NOT NULL DEFAULT '[]',
  includes         JSONB NOT NULL DEFAULT '{}',
  tour_manager     BOOLEAN NOT NULL DEFAULT TRUE,
  itinerary        JSONB NOT NULL DEFAULT '[]',
  inclusions       JSONB NOT NULL DEFAULT '[]',
  exclusions       JSONB NOT NULL DEFAULT '[]',
  need_to_know     JSONB NOT NULL DEFAULT '[]',
  cancellation_slabs JSONB NOT NULL DEFAULT '[]',
  cancellation_notes JSONB NOT NULL DEFAULT '[]',
  payment_terms    JSONB NOT NULL DEFAULT '[]',
  remarks          JSONB NOT NULL DEFAULT '[]',
  price_hidden     BOOLEAN NOT NULL DEFAULT FALSE,
  status           TEXT NOT NULL DEFAULT 'draft',
  is_featured      BOOLEAN NOT NULL DEFAULT FALSE,
  min_price        INTEGER,
  available_months JSONB NOT NULL DEFAULT '[]',
  departure_cities JSONB NOT NULL DEFAULT '[]',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS departures (
  id               SERIAL PRIMARY KEY,
  package_id       INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  departure_city   TEXT NOT NULL,
  seats_total      INTEGER NOT NULL DEFAULT 0,
  seats_left       INTEGER NOT NULL DEFAULT 0,
  price_twin       INTEGER NOT NULL,
  price_triple     INTEGER,
  price_single     INTEGER,
  price_child_bed  INTEGER,
  price_child_nobed INTEGER,
  offer_price_twin INTEGER,
  UNIQUE (package_id, date, departure_city)
);
CREATE INDEX IF NOT EXISTS departures_package_idx ON departures(package_id);

CREATE TABLE IF NOT EXISTS enquiries (
  id          SERIAL PRIMARY KEY,
  kind        TEXT NOT NULL DEFAULT 'enquiry',
  package_id  INTEGER REFERENCES packages(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  email       TEXT,
  travel_date DATE,
  adults      INTEGER,
  children    INTEGER,
  message     TEXT,
  status      TEXT NOT NULL DEFAULT 'new',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Staff sessions live here so logging out revokes the cookie on the server too.
CREATE TABLE IF NOT EXISTS admin_sessions (
  id         TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Failed admin logins, for the 3-attempts lockout.
CREATE TABLE IF NOT EXISTS login_failures (
  id  SERIAL PRIMARY KEY,
  ip  TEXT NOT NULL,
  at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS login_failures_ip_idx ON login_failures(ip, at);
