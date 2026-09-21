-- The address that prints on comprobantes (C-15's tail, N-20's waiting block).
--
-- `address_print` has been a stored toggle since 0023 with nothing to print;
-- this gives it one free line on `businesses` (max 140 enforced by the domain
-- schema). Nullable, like every branding column, so old rows and old device
-- payloads parse unchanged; cloud-ahead in the drift contract until the app
-- branch mirrors it.

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS direccion text;
