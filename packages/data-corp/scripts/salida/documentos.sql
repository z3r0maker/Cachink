-- E-44: every document kept in the Postgres BlobStore, checked against the
-- SHA-256 recorded at upload (E-26). Prints one line per bad file, so an empty
-- result means every file arrived whole. Files in Azure (`storage = 'azure'`)
-- are not here: their bytes never were in the database, and the runbook's
-- container step checks them.
SELECT format('%s %s', d.id,
         CASE WHEN b.key IS NULL THEN 'missing' ELSE 'sha256-mismatch' END)
  FROM corp.documents d
  LEFT JOIN corp.blobs b ON b.key = d.blob_key
 WHERE d.storage = 'pg'
   AND (b.key IS NULL OR encode(sha256(b.content), 'hex') <> d.sha256)
 ORDER BY d.id;
