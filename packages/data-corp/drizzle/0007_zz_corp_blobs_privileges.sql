-- The Postgres BlobStore's privileges (E-26, ADR-127 §5). Hand-written:
-- Drizzle Kit models no privileges. Applied after 0006_corp_blobs.sql.
--
-- A file is written once and read: the console may insert and select, never
-- update or delete (CFF art. 30 keeps it five years). The agents read a
-- document's metadata, never its bytes, so they get nothing here.

GRANT SELECT, INSERT ON corp.blobs TO xangarro_corp;
