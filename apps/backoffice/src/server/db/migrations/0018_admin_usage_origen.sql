-- The console's usage read needs `inventory_movements.origen` (N-07, N-10).
--
-- data-pg 0029 added `origen` and 0035's `xangarro.usage_counts` counts only
-- `origen IN ('manual', 'portal')` movements — the ADR-065 rule. The function
-- is SECURITY INVOKER, so it reads with the caller's column grants, and
-- 0006/0009 granted xangarro_admin every column it used to read but not this
-- one. Result: `admin_tenant_usage` failed with «permission denied for table
-- inventory_movements», which blanked /uso and the digest's over-limit
-- section. One more column, same posture: read-only, no write grant.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    GRANT SELECT (origen) ON public.inventory_movements TO xangarro_admin;
  END IF;
END
$$;
