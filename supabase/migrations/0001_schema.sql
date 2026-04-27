-- Supabase Postgres mirror of the 10 Cachink synced tables (ADR-035).
--
-- Ships the full schema + RLS policies + PowerSync publication. Run via
-- `supabase db push` from a developer laptop with a PAT exported as
-- `SUPABASE_ACCESS_TOKEN`. The app binary never sees this SQL — it only
-- reads/writes through PowerSync (upload queue) and the Supabase client
-- (auth).
--
-- Conventions:
--   • Primary keys are ULIDs (TEXT, 26 chars).
--   • Money stored as BIGINT centavos.
--   • Every row carries `business_id`, `device_id`, `created_at`,
--     `updated_at`, `deleted_at`.
--   • RLS isolates rows by the `business_id` JWT claim.

-- =========================================================================
-- EXTENSIONS
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================================
-- TABLES
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.businesses (
  id               TEXT PRIMARY KEY,
  nombre           TEXT NOT NULL,
  regimen_fiscal   TEXT NOT NULL,
  isr_tasa         REAL NOT NULL,
  logo_url         TEXT,
  business_id      TEXT NOT NULL,
  device_id        TEXT NOT NULL,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL,
  deleted_at       TEXT
);

CREATE TABLE IF NOT EXISTS public.sales (
  id               TEXT PRIMARY KEY,
  fecha            TEXT NOT NULL,
  concepto         TEXT NOT NULL,
  categoria        TEXT NOT NULL,
  monto_centavos   BIGINT NOT NULL,
  metodo           TEXT NOT NULL,
  cliente_id       TEXT,
  estado_pago      TEXT NOT NULL,
  business_id      TEXT NOT NULL,
  device_id        TEXT NOT NULL,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL,
  deleted_at       TEXT
);
CREATE INDEX IF NOT EXISTS idx_sales_business_fecha ON public.sales (business_id, fecha);

CREATE TABLE IF NOT EXISTS public.expenses (
  id                  TEXT PRIMARY KEY,
  fecha               TEXT NOT NULL,
  concepto            TEXT NOT NULL,
  categoria           TEXT NOT NULL,
  monto_centavos      BIGINT NOT NULL,
  proveedor           TEXT,
  gasto_recurrente_id TEXT,
  business_id         TEXT NOT NULL,
  device_id           TEXT NOT NULL,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL,
  deleted_at          TEXT
);
CREATE INDEX IF NOT EXISTS idx_expenses_business_fecha ON public.expenses (business_id, fecha);

CREATE TABLE IF NOT EXISTS public.products (
  id                     TEXT PRIMARY KEY,
  nombre                 TEXT NOT NULL,
  sku                    TEXT,
  categoria              TEXT NOT NULL,
  costo_unit_centavos    BIGINT NOT NULL,
  unidad                 TEXT NOT NULL,
  umbral_stock_bajo      INTEGER NOT NULL DEFAULT 3,
  business_id            TEXT NOT NULL,
  device_id              TEXT NOT NULL,
  created_at             TEXT NOT NULL,
  updated_at             TEXT NOT NULL,
  deleted_at             TEXT
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id                     TEXT PRIMARY KEY,
  producto_id            TEXT NOT NULL,
  fecha                  TEXT NOT NULL,
  tipo                   TEXT NOT NULL,
  cantidad               INTEGER NOT NULL,
  costo_unit_centavos    BIGINT NOT NULL,
  motivo                 TEXT NOT NULL,
  nota                   TEXT,
  business_id            TEXT NOT NULL,
  device_id              TEXT NOT NULL,
  created_at             TEXT NOT NULL,
  updated_at             TEXT NOT NULL,
  deleted_at             TEXT
);
CREATE INDEX IF NOT EXISTS idx_inv_mov_biz_fecha
  ON public.inventory_movements (business_id, fecha);

CREATE TABLE IF NOT EXISTS public.employees (
  id                 TEXT PRIMARY KEY,
  nombre             TEXT NOT NULL,
  puesto             TEXT NOT NULL,
  salario_centavos   BIGINT NOT NULL,
  periodo            TEXT NOT NULL,
  business_id        TEXT NOT NULL,
  device_id          TEXT NOT NULL,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL,
  deleted_at         TEXT
);

CREATE TABLE IF NOT EXISTS public.clients (
  id            TEXT PRIMARY KEY,
  nombre        TEXT NOT NULL,
  telefono      TEXT,
  email         TEXT,
  nota          TEXT,
  business_id   TEXT NOT NULL,
  device_id     TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  deleted_at    TEXT
);

CREATE TABLE IF NOT EXISTS public.client_payments (
  id               TEXT PRIMARY KEY,
  venta_id         TEXT NOT NULL,
  fecha            TEXT NOT NULL,
  monto_centavos   BIGINT NOT NULL,
  metodo           TEXT NOT NULL,
  nota             TEXT,
  business_id      TEXT NOT NULL,
  device_id        TEXT NOT NULL,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL,
  deleted_at       TEXT
);

CREATE TABLE IF NOT EXISTS public.day_closes (
  id                          TEXT PRIMARY KEY,
  fecha                       TEXT NOT NULL,
  efectivo_esperado_centavos  BIGINT NOT NULL,
  efectivo_contado_centavos   BIGINT NOT NULL,
  diferencia_centavos         BIGINT NOT NULL,
  explicacion                 TEXT,
  cerrado_por                 TEXT NOT NULL,
  business_id                 TEXT NOT NULL,
  device_id                   TEXT NOT NULL,
  created_at                  TEXT NOT NULL,
  updated_at                  TEXT NOT NULL,
  deleted_at                  TEXT
);

CREATE TABLE IF NOT EXISTS public.recurring_expenses (
  id                  TEXT PRIMARY KEY,
  concepto            TEXT NOT NULL,
  categoria           TEXT NOT NULL,
  monto_centavos      BIGINT NOT NULL,
  proveedor           TEXT,
  frecuencia          TEXT NOT NULL,
  dia_del_mes         INTEGER,
  dia_de_la_semana    INTEGER,
  proximo_disparo     TEXT NOT NULL,
  activo              INTEGER NOT NULL DEFAULT 1,
  business_id         TEXT NOT NULL,
  device_id           TEXT NOT NULL,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL,
  deleted_at          TEXT
);

-- =========================================================================
-- ROW LEVEL SECURITY
-- =========================================================================
-- Policy: a row is visible only when its `business_id` matches the
-- `business_id` claim in the authenticated user's JWT. Operativo and
-- Director share the same isolation — role-based row filtering happens
-- at the PowerSync Sync Streams layer.

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'businesses', 'sales', 'expenses', 'products',
    'inventory_movements', 'employees', 'clients',
    'client_payments', 'day_closes', 'recurring_expenses'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated
         USING (business_id = (current_setting(''request.jwt.claims'', true)::jsonb->>''business_id''))
         WITH CHECK (business_id = (current_setting(''request.jwt.claims'', true)::jsonb->>''business_id''))',
      'p_' || tbl || '_business_scope', tbl
    );
  END LOOP;
END
$$;

-- =========================================================================
-- POWERSYNC PUBLICATION
-- =========================================================================
-- PowerSync subscribes to logical replication via this publication.
-- Every synced table must be listed here or its changes won't propagate.

DROP PUBLICATION IF EXISTS powersync;
CREATE PUBLICATION powersync FOR TABLE
  public.businesses,
  public.sales,
  public.expenses,
  public.products,
  public.inventory_movements,
  public.employees,
  public.clients,
  public.client_payments,
  public.day_closes,
  public.recurring_expenses;

-- =========================================================================
-- ULID GENERATOR (Crockford base32)
-- =========================================================================
-- The Cachink domain layer validates IDs against the canonical 26-char
-- ULID format (Crockford base32 alphabet: `0123456789ABCDEFGHJKMNPQRSTVWXYZ`,
-- excludes I, L, O, U). The previous implementation used
-- `encode(gen_random_bytes(16), 'hex')` which produced 32-char hex —
-- domain validation rejected it on first sign-up (Slice 8 C8).
--
-- 26 chars = 10 chars 48-bit timestamp + 16 chars 80-bit randomness.

CREATE OR REPLACE FUNCTION public.cachink_generate_ulid()
RETURNS TEXT
LANGUAGE plpgsql
AS $
DECLARE
  alphabet  CONSTANT TEXT := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  ts_ms     BIGINT;
  ts_part   TEXT := '';
  rnd_bytes BYTEA;
  rnd_part  TEXT := '';
  v         INTEGER;
  buffer    BIGINT;
  bit_count INTEGER := 0;
  i         INTEGER;
BEGIN
  -- 48-bit timestamp encoded as 10 Crockford base32 chars (5 bits each).
  ts_ms := (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;
  FOR i IN REVERSE 9..0 LOOP
    v := ((ts_ms >> (i * 5)) & 31)::INTEGER;
    ts_part := ts_part || substr(alphabet, v + 1, 1);
  END LOOP;

  -- 80 bits of randomness encoded as 16 Crockford base32 chars. We pull
  -- 10 bytes (= 80 bits) and stream them through a small bit buffer.
  rnd_bytes := gen_random_bytes(10);
  buffer := 0;
  bit_count := 0;
  FOR i IN 0..9 LOOP
    buffer := (buffer << 8) | get_byte(rnd_bytes, i);
    bit_count := bit_count + 8;
    WHILE bit_count >= 5 LOOP
      bit_count := bit_count - 5;
      v := ((buffer >> bit_count) & 31)::INTEGER;
      rnd_part := rnd_part || substr(alphabet, v + 1, 1);
    END LOOP;
  END LOOP;

  RETURN ts_part || rnd_part;
END;
$;

-- =========================================================================
-- SIGN-UP TRIGGER — seed a `businesses` row + JWT claims
-- =========================================================================
-- On new user sign-up, create a Business keyed to a fresh ULID and stamp
-- `business_id` + `role` into the user's `raw_user_meta_data` so Supabase
-- emits them as JWT claims on every sign-in.

CREATE OR REPLACE FUNCTION public.seed_business_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
  new_business_id TEXT;
  business_name   TEXT;
BEGIN
  new_business_id := public.cachink_generate_ulid();
  business_name   := COALESCE(NEW.raw_user_meta_data->>'business_name', 'Mi negocio');

  INSERT INTO public.businesses (
    id, nombre, regimen_fiscal, isr_tasa, logo_url,
    business_id, device_id, created_at, updated_at, deleted_at
  ) VALUES (
    new_business_id, business_name, 'RIF', 0.30, NULL,
    new_business_id, 'pending', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), NULL
  );

  UPDATE auth.users
    SET raw_user_meta_data =
      COALESCE(raw_user_meta_data, '{}'::jsonb) ||
      jsonb_build_object('business_id', new_business_id, 'role', 'Director')
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_business_on_signup ON auth.users;
CREATE TRIGGER trg_seed_business_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_business_on_signup();
