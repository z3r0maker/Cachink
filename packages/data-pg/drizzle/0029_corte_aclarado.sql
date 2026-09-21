-- O-37: the owner's «Marcar como aclarado» needs somewhere to land. Two
-- nullable columns on `caja_turnos` — when the owner resolved the
-- difference's explanation, and who did. Cloud-ahead in the drift contract
-- until the app branch mirrors them; a device re-push cannot clobber them
-- (the push upsert sets only the columns the device's row carries).

ALTER TABLE caja_turnos
  ADD COLUMN IF NOT EXISTS aclarado_at timestamptz,
  ADD COLUMN IF NOT EXISTS aclarado_por text;
