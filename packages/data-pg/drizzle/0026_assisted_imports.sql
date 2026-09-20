-- «Hazlo por mí» (N-18): a tenant hands us their data; staff map it to an
-- import template and the tenant approves the dry-run before anything is
-- written. Three guarantees this schema carries:
--
-- 1. **Commit is impossible without tenant approval.** The commit path is a
--    guarded UPDATE (`WHERE status = 'esperando_aprobacion'`) that returns
--    the mapped file only when the guard passes; staff cannot flip a tenant
--    row to `aplicada` themselves — the admin policy (backoffice 0014) can
--    reach every row, but the guard column is the invariant the action reads.
-- 2. **Uploads are private.** File bytes live here, in the tenant database,
--    readable by the owning tenant and by staff only — no public URL, no
--    storage bucket (N-19's owner-ratified pattern: Supabase Storage REST
--    needs a JWT the in-house auth never mints).
-- 3. **Files auto-delete 30 days after resolution** (LFPDPPP): the digest
--    cron purges resolved rows' files and stamps `files_purged_at`; the
--    request record itself stays (what was asked, when, what happened).
--
-- Status machine: revision → esperando_aprobacion (staff, with plantilla +
-- a mapped file) → aplicada | rechazada (tenant) | expirada (14 d without
-- tenant action). One request in flight per business (enforced in the use
-- case); `revision` rows can also be cancelled by the tenant (→ rechazada).

CREATE TABLE assisted_imports (
  id text PRIMARY KEY NOT NULL,
  business_id text NOT NULL,
  status text NOT NULL DEFAULT 'revision'
    CHECK (status IN ('revision', 'esperando_aprobacion', 'aplicada', 'rechazada', 'expirada')),
  sistema_actual text NOT NULL,
  notas text NOT NULL DEFAULT '',
  plantilla text CHECK (plantilla IN ('productos', 'clientes')),
  requested_by text,
  resolved_at timestamptz,
  files_purged_at timestamptz,
  device_id text NOT NULL,
  created_by_user_id text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  deleted_at timestamptz
);

CREATE TABLE assisted_import_files (
  id text PRIMARY KEY NOT NULL,
  assisted_import_id text NOT NULL REFERENCES assisted_imports(id) ON DELETE CASCADE,
  business_id text NOT NULL,
  role text NOT NULL DEFAULT 'solicitud' CHECK (role IN ('solicitud', 'mapeado')),
  filename text NOT NULL,
  mime text NOT NULL,
  size_bytes integer NOT NULL,
  bytes bytea NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX assisted_imports_business_idx ON assisted_imports (business_id, created_at DESC);
CREATE INDEX assisted_import_files_import_idx ON assisted_import_files (assisted_import_id);

ALTER TABLE public.assisted_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assisted_imports FORCE ROW LEVEL SECURITY;
ALTER TABLE public.assisted_import_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assisted_import_files FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON public.assisted_imports
  USING (business_id = (SELECT xangarro.current_business_id()))
  WITH CHECK (business_id = (SELECT xangarro.current_business_id()));

CREATE POLICY tenant_isolation ON public.assisted_import_files
  USING (business_id = (SELECT xangarro.current_business_id()))
  WITH CHECK (business_id = (SELECT xangarro.current_business_id()));

-- The tenant creates and reads its own rows, updates the header (its own
-- approve/reject/cancel), and uploads files; it never deletes anything —
-- deletion is the purge's job, and the purge is staff-side (0014).
REVOKE DELETE ON public.assisted_imports FROM xangarro_app;
REVOKE DELETE ON public.assisted_import_files FROM xangarro_app;
GRANT SELECT, INSERT, UPDATE ON public.assisted_imports TO xangarro_app;
GRANT SELECT, INSERT ON public.assisted_import_files TO xangarro_app;
