-- The admin inbox (N-08, ADR-063). Portal-only (ADR-060): the customer
-- portal never reads it. Same temporary home as 0001_staff.sql; apply after
-- it (the owner FK) and after data-pg's 0001_rls.sql (see 0001's header).

CREATE TABLE IF NOT EXISTS public.support_items (
  id              text PRIMARY KEY,
  kind            text NOT NULL CHECK (kind IN
                    ('bug', 'factura', 'migracion', 'escalacion', 'limite', 'explorador', 'sistema')),
  status          text NOT NULL DEFAULT 'nuevo'
                    CHECK (status IN ('nuevo', 'en_curso', 'resuelto')),
  urgent          boolean NOT NULL DEFAULT false,
  owner_staff_id  text REFERENCES public.staff_members (id),
  business_id     text,
  title           text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 200),
  body            text NOT NULL DEFAULT '',
  attachments     jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(attachments) = 'array'),
  source          text NOT NULL,
  source_ref      text NOT NULL,
  payment_ref     text,
  cfdi_uuid       text CHECK (cfdi_uuid ~
                    '^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$'),
  created_at      timestamptz NOT NULL,
  updated_at      timestamptz NOT NULL,
  resolved_at     timestamptz,
  -- A source's retry must never file a second item.
  CONSTRAINT support_items_source_ref_key UNIQUE (source, source_ref),
  -- "Pagos sin CFDI" (ADR-070): a factura names its payment, and resolves only with a folio.
  CONSTRAINT support_items_factura_payment CHECK (kind <> 'factura' OR payment_ref IS NOT NULL),
  CONSTRAINT support_items_factura_cfdi CHECK
    (kind <> 'factura' OR status <> 'resuelto' OR cfdi_uuid IS NOT NULL),
  CONSTRAINT support_items_cfdi_only_factura CHECK
    (kind = 'factura' OR (payment_ref IS NULL AND cfdi_uuid IS NULL))
);

CREATE INDEX IF NOT EXISTS support_items_status_kind_created_idx
  ON public.support_items (status, kind, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS support_items_business_idx
  ON public.support_items (business_id);

ALTER TABLE public.support_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_items FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_app') THEN
    REVOKE ALL ON public.support_items FROM xangarro_app;
  END IF;

  -- Items are resolved, never deleted: no DELETE grant, even for the console.
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    GRANT SELECT, INSERT, UPDATE ON public.support_items TO xangarro_admin;
    DROP POLICY IF EXISTS support_items_admin ON public.support_items;
    EXECUTE 'CREATE POLICY support_items_admin ON public.support_items
               FOR ALL TO xangarro_admin USING (true) WITH CHECK (true)';
  END IF;
END
$$;
