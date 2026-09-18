-- A business's owner address, for the usage emails (N-03, B-14 open item —
-- docs/ops/email.md §6).
--
-- The owner's email lives in `auth.users`, which no cross-tenant role can
-- read, and `business_members` is behind `tenant_isolation`. B-14 therefore
-- mailed the Stripe customer, which a business only has once it starts a
-- trial: a free-from-day-one business got no usage email.
--
-- Like `xangarro.memberships_for_user` (0002), one SECURITY DEFINER function
-- answers exactly one question — "the owner's address of this business" — and
-- returns nothing else: one business id in, at most one email out (the
-- earliest owner). `search_path` is pinned, so a caller cannot shadow the
-- objects it reads.
--
-- EXECUTE goes to `xangarro_metering` only: the nightly usage cron, the one
-- caller. Not to the tenant role, not to PUBLIC.

CREATE OR REPLACE FUNCTION xangarro.owner_email(p_business_id text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT u.email
    FROM public.business_members m
    JOIN auth.users u ON u.id::text = m.user_id
   WHERE m.business_id = p_business_id
     AND m.role = 'owner'
   ORDER BY m.created_at, m.id
   LIMIT 1;
$$;

REVOKE ALL ON FUNCTION xangarro.owner_email(text) FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_app') THEN
    REVOKE ALL ON FUNCTION xangarro.owner_email(text) FROM xangarro_app;
  END IF;
END
$$;
GRANT EXECUTE ON FUNCTION xangarro.owner_email(text) TO xangarro_metering;
