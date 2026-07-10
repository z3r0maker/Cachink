-- RLS tests for the Cachink Supabase schema (ADR-035).
--
-- Runs via the Supabase pg_prove harness: `supabase test db`. Each
-- assertion sets the authenticated JWT via `set_config` and verifies
-- that cross-business reads fail while in-business reads succeed.

BEGIN;

SELECT plan(14);

-- Seed two businesses.
INSERT INTO public.businesses
  (id, nombre, regimen_fiscal, isr_tasa, logo_url, business_id, device_id, created_at, updated_at, deleted_at)
VALUES
  ('BIZ_A', 'A', 'RIF', 3000, NULL, 'BIZ_A', 'DEV_A', '2026-04-23T10:00:00.000Z', '2026-04-23T10:00:00.000Z', NULL),
  ('BIZ_B', 'B', 'RIF', 3000, NULL, 'BIZ_B', 'DEV_B', '2026-04-23T10:00:00.000Z', '2026-04-23T10:00:00.000Z', NULL);

-- Seed one sale per business.
INSERT INTO public.sales
  (id, fecha, concepto, categoria, monto_centavos, metodo, cliente_id, estado_pago,
   business_id, device_id, created_at, updated_at, deleted_at)
VALUES
  ('SALE_A', '2026-04-23', 'A', 'Producto', 10000, 'Efectivo', NULL, 'pagado',
   'BIZ_A', 'DEV_A', '2026-04-23T12:00:00.000Z', '2026-04-23T12:00:00.000Z', NULL),
  ('SALE_B', '2026-04-23', 'B', 'Producto', 20000, 'Efectivo', NULL, 'pagado',
   'BIZ_B', 'DEV_B', '2026-04-23T12:00:00.000Z', '2026-04-23T12:00:00.000Z', NULL);

SET role authenticated;

-- Simulate a user with BIZ_A's business_id.
SELECT set_config('request.jwt.claims',
  '{"sub":"user-a","business_id":"BIZ_A","role":"Director"}', true);
SELECT is((SELECT count(*) FROM public.sales)::int, 1, 'Director in BIZ_A sees exactly 1 sale');
SELECT is((SELECT id FROM public.sales LIMIT 1), 'SALE_A', 'Director in BIZ_A sees SALE_A');

-- Simulate a user with BIZ_B's business_id.
SELECT set_config('request.jwt.claims',
  '{"sub":"user-b","business_id":"BIZ_B","role":"Operativo"}', true);
SELECT is((SELECT count(*) FROM public.sales)::int, 1, 'Operativo in BIZ_B sees exactly 1 sale');
SELECT is((SELECT id FROM public.sales LIMIT 1), 'SALE_B', 'Operativo in BIZ_B sees SALE_B');

-- Cross-business writes must fail.
SELECT throws_ok(
  $$INSERT INTO public.sales (id, fecha, concepto, categoria, monto_centavos, metodo, cliente_id, estado_pago,
                              business_id, device_id, created_at, updated_at, deleted_at)
    VALUES ('HACK', '2026-04-23', 'X', 'Producto', 100, 'Efectivo', NULL, 'pagado',
            'BIZ_A', 'DEV_B', '2026-04-23T12:00:00.000Z', '2026-04-23T12:00:00.000Z', NULL)$$,
  '42501',
  NULL,
  'Operativo in BIZ_B cannot insert a row claiming business_id=BIZ_A'
);

-- Unauthenticated users see nothing.
RESET role;
SELECT set_config('request.jwt.claims', NULL, true);
SET role anon;
SELECT is((SELECT count(*) FROM public.sales)::int, 0, 'Anonymous sees no rows');

-- =========================================================================
-- Bug database tables: deny-by-default RLS
-- =========================================================================
-- error_events and bug_reports have RLS enabled with ZERO policies,
-- meaning neither anon nor authenticated can access them via PostgREST.
-- Only the service-role key (used by the Edge Function) bypasses RLS.

-- Seed one error event and one bug report (as superuser).
RESET role;
SELECT set_config('request.jwt.claims', NULL, true);
INSERT INTO public.error_events
  (fingerprint, error_name, error_message, source, device_id, occurred_at)
VALUES
  ('fp_test', 'TestError', 'test message', 'ui', 'DEV_A', '2026-07-08T10:00:00Z');

INSERT INTO public.bug_reports
  (description, device_id, submitted_at)
VALUES
  ('test report', 'DEV_A', '2026-07-08T10:00:00Z');

-- Authenticated user cannot SELECT error_events.
SET role authenticated;
SELECT set_config('request.jwt.claims',
  '{"sub":"user-a","business_id":"BIZ_A","role":"Director"}', true);
SELECT is(
  (SELECT count(*) FROM public.error_events)::int, 0,
  'Authenticated user cannot SELECT error_events (zero policies)');

-- Authenticated user cannot SELECT bug_reports.
SELECT is(
  (SELECT count(*) FROM public.bug_reports)::int, 0,
  'Authenticated user cannot SELECT bug_reports (zero policies)');

-- Authenticated user cannot INSERT into error_events.
SELECT throws_ok(
  $INSERT INTO public.error_events
    (fingerprint, error_name, error_message, source, device_id, occurred_at)
  VALUES ('fp_hack', 'HackError', 'hack', 'ui', 'DEV_A', '2026-07-08T11:00:00Z')$,
  '42501', NULL,
  'Authenticated user cannot INSERT into error_events');

-- Authenticated user cannot INSERT into bug_reports.
SELECT throws_ok(
  $INSERT INTO public.bug_reports
    (description, device_id, submitted_at)
  VALUES ('hack report', 'DEV_A', '2026-07-08T11:00:00Z')$,
  '42501', NULL,
  'Authenticated user cannot INSERT into bug_reports');

-- Anonymous cannot SELECT error_events.
RESET role;
SELECT set_config('request.jwt.claims', NULL, true);
SET role anon;
SELECT is(
  (SELECT count(*) FROM public.error_events)::int, 0,
  'Anonymous cannot SELECT error_events');

-- Anonymous cannot SELECT bug_reports.
SELECT is(
  (SELECT count(*) FROM public.bug_reports)::int, 0,
  'Anonymous cannot SELECT bug_reports');

-- Anonymous cannot INSERT into error_events.
SELECT throws_ok(
  $INSERT INTO public.error_events
    (fingerprint, error_name, error_message, source, device_id, occurred_at)
  VALUES ('fp_anon', 'AnonError', 'anon', 'ui', 'DEV_A', '2026-07-08T11:00:00Z')$,
  '42501', NULL,
  'Anonymous cannot INSERT into error_events');

-- Anonymous cannot INSERT into bug_reports.
SELECT throws_ok(
  $INSERT INTO public.bug_reports
    (description, device_id, submitted_at)
  VALUES ('anon report', 'DEV_A', '2026-07-08T11:00:00Z')$,
  '42501', NULL,
  'Anonymous cannot INSERT into bug_reports');

SELECT * FROM finish();

ROLLBACK;
