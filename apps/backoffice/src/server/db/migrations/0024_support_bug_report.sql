-- B-21 (ADR-162): a bug report's category and the error it names.
--
-- The phone's report sheet asks «¿Qué pasó?» with four options to tap, and a
-- report opened from a failure names that failure's Sentry event. The portal
-- files both with the item (`kind = 'bug'`), so the inbox can show a report
-- beside its error (N-88). Only bug items carry them, and both are optional:
-- a report from a build made before this has neither.
--
-- The values are the domain's (`BUG_REPORT_CATEGORIES`, `ERROR_EVENT_ID_REGEX`).
-- Rows filed before this keep NULL in both, which every CHECK allows.
--
-- Idempotent: the columns and the constraints are guarded.

SET LOCAL lock_timeout = '200ms';

ALTER TABLE public.support_items ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.support_items ADD COLUMN IF NOT EXISTS event_id text;

ALTER TABLE public.support_items DROP CONSTRAINT IF EXISTS support_items_bug_category;
ALTER TABLE public.support_items
  ADD CONSTRAINT support_items_bug_category
  CHECK (category IS NULL OR (kind = 'bug' AND category IN
    ('could_not_charge', 'froze_or_closed', 'wrong_number', 'other')));

ALTER TABLE public.support_items DROP CONSTRAINT IF EXISTS support_items_bug_event;
ALTER TABLE public.support_items
  ADD CONSTRAINT support_items_bug_event
  CHECK (event_id IS NULL OR (kind = 'bug' AND event_id ~ '^[0-9a-f]{32}$'));
