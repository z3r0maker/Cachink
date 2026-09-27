-- The owner's display name for the caja's copy («De Pedro», «Le mandaste tu
-- respuesta a Pedro»), plan 11 §3.3.
--
-- The name lives in `auth.users.raw_user_meta_data->>'nombre'` (0024, amends
-- ADR-087), which the tenant role cannot read. Like `xangarro.owner_email`
-- (0011), one SECURITY DEFINER function answers exactly one question: the
-- display name of the earliest owner of **the business of this request**.
-- It takes no argument: the business is `xangarro.current_business_id()`, the
-- claim `withTenant` sets, so a tenant can never ask about another business.
-- NULL when there is no owner or the account never set a name (the caja then
-- says «el dueño»). `search_path` is pinned, so a caller cannot shadow the
-- objects it reads.
--
-- EXECUTE goes to `xangarro_app` only (bootstrap and every device pull, inside
-- the tenant transaction). Not to PUBLIC.

CREATE OR REPLACE FUNCTION xangarro.owner_nombre()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT NULLIF(btrim(coalesce(u.raw_user_meta_data->>'nombre', '')), '')
    FROM public.business_members m
    JOIN auth.users u ON u.id::text = m.user_id
   WHERE m.business_id = xangarro.current_business_id()
     AND m.role = 'owner'
   ORDER BY m.created_at, m.id
   LIMIT 1;
$$;

REVOKE ALL ON FUNCTION xangarro.owner_nombre() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION xangarro.owner_nombre() TO xangarro_app;
