-- `empleado_id` on `expenses` (O-26, approved by the owner 2026-09-19).
--
-- The phone records a payroll payment as an `expenses` row whose only tie to
-- the employee used to be the text «Nómina {nombre}» — a rename broke it
-- (finding F-3's sibling in 13-web-portal-handoff). This nullable column is
-- the data link P-12's employee drawer reads; the phone's writers populate it
-- from Track A's follow-up. SQLite side: 0001… the paired migration is
-- packages/data 0010 — drift.test.ts holds the column lists equal.

ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS empleado_id text;

COMMENT ON COLUMN public.expenses.empleado_id IS
  'Payroll payments name their employee; null for every other expense (O-26).';
