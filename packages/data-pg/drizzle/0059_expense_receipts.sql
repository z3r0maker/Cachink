-- 0059: a gasto's receipt photo (ADR-149, M-18).
--
-- `expense_receipts` is an UP table (contract §8): the phone pushes it and no
-- device ever pulls it, because no other phone shows a receipt. A receipt is
-- one grayscale WebP, longest side 1024 px, at most 96 KB, carried over the
-- wire as base64 and landing here as `bytea`, behind the ADR-127 port like
-- `product_images` (0050). There is no tombstone: every row is a photo, so
-- `bytes`, `width` and `height` are NOT NULL. The newest row per gasto
-- (`created_at`, then `id`) is the receipt.
--
-- Column names mirror the device's SQLite table (`tests/drift.test.ts`).

-- `SET LOCAL`: the timeout dies with this file's transaction (R2-13).
SET LOCAL lock_timeout = '200ms';

CREATE TABLE IF NOT EXISTS public.expense_receipts (
  id text PRIMARY KEY NOT NULL,
  gasto_id text NOT NULL,
  mime text NOT NULL DEFAULT 'image/webp' CHECK (mime = 'image/webp'),
  bytes bytea NOT NULL CHECK (octet_length(bytes) BETWEEN 1 AND 98304),
  width integer NOT NULL CHECK (width BETWEEN 1 AND 1024),
  height integer NOT NULL CHECK (height BETWEEN 1 AND 1024),
  business_id text NOT NULL,
  device_id text NOT NULL,
  created_by_user_id text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  deleted_at timestamptz
);

-- Every RLS table keyed by business_id leads an index with it (DB-IDX-01);
-- «the newest receipt of this gasto» walks it backwards, and the Movimientos
-- page asks it for the ten gastos it shows.
CREATE INDEX IF NOT EXISTS expense_receipts_business_gasto_idx
  ON public.expense_receipts (business_id, gasto_id, created_at DESC, id DESC);

ALTER TABLE public.expense_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_receipts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON public.expense_receipts;
CREATE POLICY tenant_isolation ON public.expense_receipts
  USING (business_id = (SELECT xangarro.current_business_id()))
  WITH CHECK (business_id = (SELECT xangarro.current_business_id()));

-- The push upserts UP rows (last write wins by `updated_at`), and
-- `INSERT … ON CONFLICT DO UPDATE` needs UPDATE, so it stays granted; a
-- re-push of the same id is the only update. DELETE is off (0036).
GRANT SELECT, INSERT, UPDATE ON public.expense_receipts TO xangarro_app;
