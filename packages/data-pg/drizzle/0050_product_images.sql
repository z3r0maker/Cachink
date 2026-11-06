-- 0050: product photos (ADR-134, C-24).
--
-- `product_images` is the fourth HYBRID table (contract §8): phones and the
-- portal insert, nobody updates, the newest row per product wins. A photo is
-- one 512 px WebP, at most 40 KB, lifted off its background on the phone and
-- carried over the wire as base64 — here it lands as `bytea`, behind the
-- ADR-127 port that moves it to Azure Blob later without touching the wire.
-- A row whose `bytes` is NULL is the tombstone that removes the photo, and
-- carries no size; a photo carries both.
--
-- Column names mirror the device's SQLite table (`tests/drift.test.ts`).

-- `SET LOCAL`: the timeout dies with this file's transaction (R2-13).
SET LOCAL lock_timeout = '200ms';

CREATE TABLE IF NOT EXISTS public.product_images (
  id text PRIMARY KEY NOT NULL,
  producto_id text NOT NULL,
  mime text NOT NULL DEFAULT 'image/webp' CHECK (mime = 'image/webp'),
  bytes bytea CHECK (bytes IS NULL OR octet_length(bytes) <= 40960),
  width integer CHECK (width IS NULL OR width BETWEEN 1 AND 512),
  height integer CHECK (height IS NULL OR height BETWEEN 1 AND 512),
  business_id text NOT NULL,
  device_id text NOT NULL,
  created_by_user_id text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  deleted_at timestamptz,
  CONSTRAINT product_images_photo_or_tombstone
    CHECK ((bytes IS NULL) = (width IS NULL) AND (bytes IS NULL) = (height IS NULL))
);

-- Every RLS table keyed by business_id leads an index with it (DB-IDX-01);
-- «the newest row of this product» walks it backwards.
CREATE INDEX IF NOT EXISTS product_images_business_producto_idx
  ON public.product_images (business_id, producto_id, created_at DESC, id DESC);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON public.product_images;
CREATE POLICY tenant_isolation ON public.product_images
  USING (business_id = (SELECT xangarro.current_business_id()))
  WITH CHECK (business_id = (SELECT xangarro.current_business_id()));

-- Append-only: the app role inserts and reads; it never updates or deletes.
-- (0036 already keeps DELETE off every new table; UPDATE is revoked here.)
REVOKE UPDATE, DELETE ON public.product_images FROM xangarro_app;
GRANT SELECT, INSERT ON public.product_images TO xangarro_app;
