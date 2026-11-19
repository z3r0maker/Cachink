-- `caja_turno_id` on `client_payments` (ADR-146, finding M5).
--
-- An abono had no turno, so every expected-cash figure guessed it from the
-- day, and a second turno the same day counted the first one's cash abonos.
-- The abono now carries the turno whose drawer received it, as `expenses`
-- has since 0023. Nullable: rows written before this column, and abonos
-- received with no turno open, belong to no drawer. SQLite side: packages/data
-- 0015; drift.test.ts holds the column lists equal.

SET LOCAL lock_timeout = '200ms';

ALTER TABLE public.client_payments ADD COLUMN IF NOT EXISTS caja_turno_id text;

CREATE INDEX IF NOT EXISTS client_payments_business_turno_idx
  ON public.client_payments (business_id, caja_turno_id);

COMMENT ON COLUMN public.client_payments.caja_turno_id IS
  'The turno whose drawer received the abono; null when none was open (ADR-146).';
