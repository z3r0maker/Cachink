-- 0060: a product's barcode as one key (ADR-150 §5, P-44).
--
-- `codigo_canonico` is `codigoCanonico(sku)` from `@xangarro/domain`, written
-- in SQL: null for an empty code; a code of only digits whose length is 8, 12,
-- 13 or 14 is a GTIN, left-padded with zeros to the 14-digit GS1 form, so UPC-A
-- and its EAN-13 form meet; any other code trimmed and upper-cased. The `sku`
-- keeps what was saved. `tests/codigo-canonico.integration.test.ts` checks the
-- two rules agree on the same fixture codes.
--
-- Stored and generated, so no writer can set it and old rows get it here. It
-- is deliberately absent from the Drizzle schema: Drizzle's selects never read
-- it, so it never reaches the wire (products is HYBRID) or the domain shape;
-- `findProductosPorCodigo` names it in SQL.
--
-- The index is not unique (ADR-150 §2): a phone that registered a code offline
-- must not have its push bounce at sync (ADR-053 §5). The portal refuses a
-- duplicate in `CrearProductoUseCase` and the edit instead. Archived products
-- (`deleted_at`) are left out, so their codes can be used again.

-- `SET LOCAL`: the timeout dies with this file's transaction (R2-13).
SET LOCAL lock_timeout = '200ms';

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS codigo_canonico text GENERATED ALWAYS AS (
    CASE
      WHEN sku IS NULL OR btrim(sku, E' \t\n\r\f\v') = '' THEN NULL
      WHEN btrim(sku, E' \t\n\r\f\v') ~ '^([0-9]{8}|[0-9]{12,14})$'
        THEN lpad(btrim(sku, E' \t\n\r\f\v'), 14, '0')
      ELSE upper(btrim(sku, E' \t\n\r\f\v'))
    END
  ) STORED;

-- Every RLS table keyed by business_id leads an index with it (DB-IDX-01).
CREATE INDEX IF NOT EXISTS products_business_codigo_idx
  ON public.products (business_id, codigo_canonico)
  WHERE deleted_at IS NULL;
