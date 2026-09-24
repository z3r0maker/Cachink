-- N-33: the CFDIs de egreso (notas de crédito) a payment's refunds produced.
--
-- A partial refund of a payment with its own CFDI, or a refund of a payment
-- already inside a stamped global, is answered with a tipo E CFDI related to
-- the income one. A payment can have several (one per partial refund), so
-- they live as a JSON array on the payment row, like `cancellation`:
-- `[{ refundId, providerId, uuid, totalCentavos }]`, the amount a decimal
-- string of centavos (JSON has no bigint).
--
-- Additive and nullable: existing rows read as «no notes». The table's grants
-- are table-level (0009), so `xangarro_billing` can write the new column with
-- no new GRANT.

ALTER TABLE public.cfdi_payments ADD COLUMN IF NOT EXISTS credit_notes jsonb;
