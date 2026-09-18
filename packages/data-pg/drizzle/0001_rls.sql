-- Row-level security.
--
-- Every tenant-scoped table is readable and writable only for the business in
-- the request's JWT. Drizzle Kit does not model policies, so this file is
-- hand-written and numbered alongside the generated migrations. It is the one
-- documented exception to "no hand-written SQL" (CLAUDE.md §6).
--
-- The claim is read through a function rather than inlined so that a change of
-- claim name is one edit rather than twenty-five, and so the policies read the
-- same on every table.

CREATE SCHEMA IF NOT EXISTS xangarro;

-- The business this request may touch, or NULL when the claim is absent.
-- STABLE, not IMMUTABLE: it varies per request but not within a statement,
-- which lets the planner cache it per scan instead of per row.
CREATE OR REPLACE FUNCTION xangarro.current_business_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(
    COALESCE(
      current_setting('request.jwt.claims', true)::jsonb ->> 'business_id',
      current_setting('xangarro.business_id', true)
    ),
    ''
  );
$$;

DO $$
DECLARE
  t text;
  tenant_tables text[] := ARRAY[
    'businesses', 'users', 'employees', 'clients',
    'products', 'inventory_movements', 'conversion_recetas', 'conversions',
    'auditorias_inventario',
    'sales', 'expenses', 'client_payments', 'entregas_credito', 'recurring_expenses',
    'caja_turnos', 'caja_movimientos', 'cancelacion_logs', 'day_closes',
    'notices', 'metas', 'business_members', 'devices', 'activation_codes',
    'sync_rejections', 'sync_log'
  ];
BEGIN
  FOREACH t IN ARRAY tenant_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    -- FORCE so the table owner is not exempt: a migration or a mistaken
    -- superuser query must not be able to read across tenants either.
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON public.%I
         USING (business_id = xangarro.current_business_id())
         WITH CHECK (business_id = xangarro.current_business_id())',
      t
    );
  END LOOP;
END
$$;

-- The application role.
--
-- **Superusers bypass RLS entirely, and `FORCE` does not apply to them.** A
-- policy is therefore worthless if the app connects as `postgres`: every query
-- silently sees every tenant. This role has no BYPASSRLS and is not a
-- superuser, so the policies above actually bind. Supabase's `authenticated`
-- role plays the same part in production; this is its local equivalent.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_app') THEN
    CREATE ROLE xangarro_app LOGIN PASSWORD 'xangarro_app';
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public, xangarro TO xangarro_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO xangarro_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO xangarro_app;
GRANT EXECUTE ON FUNCTION xangarro.current_business_id() TO xangarro_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO xangarro_app;
