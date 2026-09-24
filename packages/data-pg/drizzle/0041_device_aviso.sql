-- N-34: which aviso de privacidad a device showed when it was linked.
--
-- Linking asks for no consent (variante B of the aviso simplificado): the
-- person linking accepted the aviso when creating the account, or is an
-- operator whose data the business handles. What must be provable is that the
-- notice was shown, and which one. The device sends the version it rendered;
-- `/activate` stores it with the SHA-256 of the text the server knows for that
-- version (`avisoVinculacionTexto()`), or no hash for a version it does not
-- know. An older app sends nothing and both stay null.
--
-- Additive and nullable. `devices` is written under the tenant's RLS policy
-- with table-level grants, so the new columns need no GRANT.

ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS aviso_version text
  CHECK (aviso_version IS NULL OR length(aviso_version) BETWEEN 1 AND 40);
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS aviso_sha256 text
  CHECK (aviso_sha256 IS NULL OR aviso_sha256 ~ '^[0-9a-f]{64}$');
