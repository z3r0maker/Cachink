-- N-18's staff side (companion to data-pg 0026): the console reads every
-- tenant's assisted import (to triage the migracion inbox items), writes the
-- staff-only transitions (attach mapped file, send to approval — the tenant
-- alone can apply), and the digest cron purges expired uploads (LFPDPPP,
-- 30 days post-resolution). The commit invariant stays in the guarded
-- `claimForApproval` UPDATE: the admin role could reach every row, but only
-- `status = 'esperando_aprobacion'` + the tenant's own connection can flip
-- it to `aplicada` — staff never can.

CREATE POLICY assisted_imports_admin ON public.assisted_imports
  FOR ALL TO xangarro_admin USING (true) WITH CHECK (true);

CREATE POLICY assisted_import_files_admin ON public.assisted_import_files
  FOR ALL TO xangarro_admin USING (true) WITH CHECK (true);

-- The purge deletes file rows only (the request record stays, stamped by the
-- query). Migrations run as the owner; this grant is for the cron's admin
-- connection at runtime.
GRANT SELECT, INSERT, UPDATE ON public.assisted_imports TO xangarro_admin;
GRANT SELECT, INSERT, DELETE ON public.assisted_import_files TO xangarro_admin;
