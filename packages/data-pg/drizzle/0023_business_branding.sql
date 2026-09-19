-- Business branding and receipts (C-15, N-19/N-20).
--
-- 1. `businesses` gains the branding columns the wire already carries (the
--    domain schema defaulted them before this migration, so old rows and old
--    device payloads parse unchanged): brand colour, the receipt template,
--    the leyenda, whether the address prints, WhatsApp, social links (a JSON
--    string, this table's own `feature_flags` precedent — device parity).
--
-- 2. `business_logos` — portal-only (never synced; the wire carries only the
--    stable URL). Supabase Storage was ruled out at the N-19 interview
--    (2026-09-18): its REST upload needs a Supabase JWT the in-house auth
--    never mints and the service role is forbidden in apps/web (N-05), so the
--    bytes live in the database and are served by an apps/web route.
--
-- 3. `xangarro.logo_publico(p_business_id)` — a logo is public (it prints on
--    receipts), so the route reads it through this SECURITY DEFINER function
--    without a tenant claim, and nothing else of the table comes out.

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS brand_color text,
  ADD COLUMN IF NOT EXISTS receipt_template text NOT NULL DEFAULT 'clasico'
    CONSTRAINT businesses_receipt_template_check
    CHECK (receipt_template IN ('clasico', 'moderno', 'ticket', 'minimal')),
  ADD COLUMN IF NOT EXISTS receipt_leyenda text,
  ADD COLUMN IF NOT EXISTS address_print boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS social_links text NOT NULL DEFAULT '{}';

CREATE TABLE business_logos (
  business_id text PRIMARY KEY NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  mime text NOT NULL,
  bytes bytea NOT NULL,
  updated_at timestamptz NOT NULL
);

ALTER TABLE public.business_logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_logos FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON public.business_logos
  USING (business_id = (SELECT xangarro.current_business_id()))
  WITH CHECK (business_id = (SELECT xangarro.current_business_id()));

REVOKE DELETE ON public.business_logos FROM xangarro_app;
GRANT SELECT, INSERT, UPDATE ON public.business_logos TO xangarro_app;

CREATE FUNCTION xangarro.logo_publico(p_business_id text)
RETURNS TABLE (mime text, bytes bytea)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT l.mime, l.bytes
    FROM public.business_logos l
   WHERE l.business_id = p_business_id;
$$;

REVOKE ALL ON FUNCTION xangarro.logo_publico(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION xangarro.logo_publico(text) TO xangarro_app;
