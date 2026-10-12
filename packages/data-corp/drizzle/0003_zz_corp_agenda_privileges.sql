-- The Agenda's and the Expediente's privileges (E-04, E-05; ADR-126).
-- Hand-written: Drizzle Kit models no privileges. Applied after
-- 0003_corp_agenda.sql.
--
-- 1. The company row and an obligation's state change as the founders work,
--    so the console may update them; never delete.
-- 2. A document is written once and read; a new version names the one it
--    supersedes. Nothing is updated or deleted (CFF art. 30 keeps them five
--    years).
-- 3. The agents read the metadata of documents, never their bytes.

GRANT SELECT, INSERT, UPDATE ON corp.company, corp.obligations TO xangarro_corp;
GRANT SELECT, INSERT ON corp.documents TO xangarro_corp;

GRANT SELECT ON corp.company, corp.obligations TO xangarro_corp_agent;
GRANT SELECT (id, kind, folder, title, period, filename, mime, size_bytes, sha256,
              obligation_id, entry_id,
              retain_until, supersedes_id, uploaded_by, uploaded_at)
  ON corp.documents TO xangarro_corp_agent;
