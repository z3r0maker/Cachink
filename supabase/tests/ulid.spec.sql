-- ULID generator smoke tests (Slice 8 C8).
--
-- Runs via `supabase test db`. Verifies `cachink_generate_ulid()`
-- returns a string that the Cachink domain layer's regex will accept:
--   - exactly 26 characters
--   - only Crockford base32 alphabet (0-9, A-H, J, K, M, N, P-T, V-Z)
--   - never empty / null
--   - distinct between calls (sanity, not randomness depth).

BEGIN;

SELECT plan(5);

-- 1) Length is 26.
SELECT is(
  length(public.cachink_generate_ulid()),
  26,
  'ULID is exactly 26 characters'
);

-- 2) Matches the Crockford base32 regex.
SELECT ok(
  public.cachink_generate_ulid() ~ '^[0-9A-HJKMNP-TV-Z]{26}$',
  'ULID matches the Crockford base32 alphabet'
);

-- 3) Is never NULL.
SELECT is(
  public.cachink_generate_ulid() IS NULL,
  FALSE,
  'ULID is never NULL'
);

-- 4) Two consecutive calls produce different values.
SELECT isnt(
  public.cachink_generate_ulid(),
  public.cachink_generate_ulid(),
  'Two consecutive ULIDs are distinct'
);

-- 5) The signup trigger now stamps a 26-char id (regression check for the
--    32-char hex bug from Slice 7). We can't simulate `auth.users` insert
--    here, but we can call the same generator path and assert the id the
--    trigger would write would match the schema constraint.
SELECT ok(
  public.cachink_generate_ulid() ~ '^[0-9A-HJKMNP-TV-Z]{26}$',
  'Trigger-shaped id passes the domain ULID regex'
);

SELECT * FROM finish();
ROLLBACK;
