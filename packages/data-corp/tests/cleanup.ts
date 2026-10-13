import postgres from 'postgres';

/**
 * The corp role cannot delete (ADR-124 §4), so each integration file removes
 * what it wrote through the owner login, by its own author id. Files run in
 * parallel; an id per file keeps one from deleting another's rows mid-test.
 */
export async function borrarLoDe(createdBy: string): Promise<void> {
  const url = process.env.DATABASE_SUPER_URL;
  if (url === undefined || url === '') return;
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await sql.begin(async (tx) => {
      await tx`UPDATE corp.registries SET document_id = NULL WHERE document_id IN (
                 SELECT id FROM corp.documents WHERE uploaded_by = ${createdBy})`;
      await tx`DELETE FROM corp.documents WHERE uploaded_by = ${createdBy}`;
      await tx`DELETE FROM corp.share_events WHERE created_by = ${createdBy}`;
      await tx`DELETE FROM corp.certificates WHERE created_by = ${createdBy}`;
      await tx`DELETE FROM corp.obligations WHERE created_by = ${createdBy}`;
      await tx`DELETE FROM corp.company WHERE updated_by = ${createdBy}`;
      const mine = tx`SELECT id FROM corp.entries WHERE created_by = ${createdBy}`;
      await tx`DELETE FROM corp.entry_lines WHERE entry_id IN (${mine})`;
      await tx`DELETE FROM corp.entries WHERE id IN (${mine})`;
      await tx`DELETE FROM corp.funding_calls WHERE created_by = ${createdBy}`;
    });
  } finally {
    await sql.end({ timeout: 5 });
  }
}
