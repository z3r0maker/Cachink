-- N-34: ARCO requests in the inbox.
--
-- A titular's request under LFPDPPP (acceso, rectificación, cancelación,
-- oposición, or revoking consent) is filed by the portal's public form as
-- `kind = 'arco'`, with `due_at`: the legal deadline to answer, 20 días
-- hábiles after it was received (the domain's `plazosArco`). The inbox shows
-- it and the digest can sort by it. Only ARCO items carry one.
--
-- Idempotent: the kind CHECK is dropped and re-added, the column and the
-- constraint are guarded.

ALTER TABLE public.support_items ADD COLUMN IF NOT EXISTS due_at timestamptz;

ALTER TABLE public.support_items DROP CONSTRAINT IF EXISTS support_items_kind_check;
ALTER TABLE public.support_items
  ADD CONSTRAINT support_items_kind_check CHECK (kind IN
    ('arco', 'ayuda', 'bug', 'factura', 'migracion', 'escalacion', 'limite', 'explorador',
     'sistema'));

ALTER TABLE public.support_items DROP CONSTRAINT IF EXISTS support_items_arco_due;
ALTER TABLE public.support_items
  ADD CONSTRAINT support_items_arco_due CHECK ((kind = 'arco') = (due_at IS NOT NULL));

CREATE INDEX IF NOT EXISTS support_items_arco_due_idx
  ON public.support_items (due_at) WHERE kind = 'arco' AND status <> 'resuelto';
