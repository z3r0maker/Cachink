-- N-08 follow-up: the portal's «Ayuda» form (N-05's wiring list) files
-- `kind = 'ayuda'` — a question or request that is neither a bug report nor
-- an escalation. The domain list already carries it; this widens the table's
-- CHECK to match, idempotently (drop + re-add reads the same on every run).

ALTER TABLE public.support_items DROP CONSTRAINT IF EXISTS support_items_kind_check;

ALTER TABLE public.support_items
  ADD CONSTRAINT support_items_kind_check CHECK (kind IN
    ('ayuda', 'bug', 'factura', 'migracion', 'escalacion', 'limite', 'explorador', 'sistema'));

-- The console reads and writes every kind; nothing else changes here.
