-- 0055: no SECURITY DEFINER function searches `public` first (audit F-15b).
--
-- A definer runs with its owner's rights — here an owner that bypasses RLS —
-- so the schemas its unqualified names resolve through are part of what it is
-- trusted with. Six functions pinned `search_path = public, pg_catalog`: an
-- object created in `public` with a built-in's name (`lower`, `now`, an
-- operator) would be found before the real one and run as the owner. Every
-- other definer in this repository already pins `pg_catalog` first.
--
-- Only the order changes. Each body names its relations with their schema
-- (`public.business_members`, `public.activation_codes`, …) and calls nothing
-- but built-ins and `xangarro.*`, and `public` holds no function, type or
-- relation named like one in `pg_catalog`, so every name resolves to the
-- object it resolved to before. `public` stays on the path, second, so
-- nothing that relied on it being there loses it.
--
-- ALTER, not CREATE OR REPLACE: the bodies of record stay in the files that
-- wrote them (0037, 0038, 0039, 0051), and a setting is repeatable — the
-- hosted runner may apply this file twice.
--
-- `tests/migration-definer-search-path.integration.test.ts` reads
-- `pg_proc.proconfig` for every definer in the schemas this repository owns,
-- so a later CREATE OR REPLACE that brings `public` back to the front fails.

SET LOCAL lock_timeout = '200ms';

-- 0051 (earlier: 0002, 0016, 0048).
ALTER FUNCTION xangarro.memberships_for_user(text) SET search_path = pg_catalog, public;
ALTER FUNCTION xangarro.negocios_for_user(text) SET search_path = pg_catalog, public;
-- 0037 (earlier: 0003).
ALTER FUNCTION xangarro.redeem_activation_code(text, text, text) SET search_path = pg_catalog, public;
-- 0038.
ALTER FUNCTION xangarro.redeem_pairing_token(text, text) SET search_path = pg_catalog, public;
-- 0039.
ALTER FUNCTION xangarro.tenant_platform_flags() SET search_path = pg_catalog, public;
ALTER FUNCTION xangarro.tenant_plan_overrides() SET search_path = pg_catalog, public;
