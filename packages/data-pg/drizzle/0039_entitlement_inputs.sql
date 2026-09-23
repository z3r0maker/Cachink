-- N-09, N-06: what the console sets reaches the entitlement.
--
-- Two staff-made inputs change what a business is entitled to, and until now
-- the portal read neither: platform flags and kill switches (backoffice
-- `0005_platform_flags.sql`) and expiring plan overrides (backoffice
-- `0003_plan_overrides.sql`). Both tables are the console's; the portal holds
-- no grant on either. As `0003_plan_overrides.sql` planned, it reads them
-- through two narrow SECURITY DEFINER functions scoped to the tenant of the
-- current transaction — never an id passed in — and returning nothing staff
-- wrote for staff: no reason, no author.
--
-- **Guarded.** The console's migrations run on the hosted project and in the
-- console's CI job, but not in the portal's local database or its CI job. So
-- each function answers «no rows» when its table does not exist — an empty
-- flags table and no overrides, which is exactly the code defaults — instead
-- of failing every entitlement. The table is read through EXECUTE, so the
-- function body never binds to a relation that may be missing.
--
-- Like every definer here, the owner bypasses RLS (checked by the hosted
-- preflight): `plan_overrides` forces RLS with an admin-only policy.
--
-- `tests/entitlement-inputs.integration.test.ts` applies the two console
-- migrations and proves scoping, the missing-table answer and the grants.

CREATE OR REPLACE FUNCTION xangarro.tenant_platform_flags()
RETURNS TABLE (flag_key text, mode text, allowlist_business_ids text[], updated_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF to_regclass('public.platform_flags_for_entitlement') IS NULL THEN
    RETURN;
  END IF;
  -- The view already cuts each allowlist down to current_business_id().
  RETURN QUERY EXECUTE
    'SELECT flag_key, mode, allowlist_business_ids, updated_at
       FROM public.platform_flags_for_entitlement';
END;
$$;

CREATE OR REPLACE FUNCTION xangarro.tenant_plan_overrides()
RETURNS TABLE (id text, kind text, days integer, plan_id text,
               expires_at timestamptz, created_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  biz text := xangarro.current_business_id();
BEGIN
  IF biz IS NULL OR to_regclass('public.plan_overrides') IS NULL THEN
    RETURN;
  END IF;
  RETURN QUERY EXECUTE
    'SELECT id, kind, days, plan_id, expires_at, created_at
       FROM public.plan_overrides
      WHERE business_id = $1
      ORDER BY created_at'
    USING biz;
END;
$$;

REVOKE ALL ON FUNCTION xangarro.tenant_platform_flags() FROM PUBLIC;
REVOKE ALL ON FUNCTION xangarro.tenant_plan_overrides() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION xangarro.tenant_platform_flags() TO xangarro_app;
GRANT EXECUTE ON FUNCTION xangarro.tenant_plan_overrides() TO xangarro_app;
