/**
 * Operator CLI: E-26's one-time move of «Empresa»'s files from Postgres
 * (`corp.blobs`) to Azure Blob (`corp-docs`), from a trusted machine, with
 * `CORP_OWNER_DATABASE_URL` pointing at the corp schema's **owner** (the
 * console's role cannot update documents) and the console's `CORP_BLOB_*`.
 *
 *   pnpm --filter @xangarro/backoffice corp-blobs:move            # what would move
 *   pnpm --filter @xangarro/backoffice corp-blobs:move --aplicar  # copy, check, point
 *   pnpm --filter @xangarro/backoffice corp-blobs:move --vaciar   # empty corp.blobs
 *
 * `--aplicar` checks every file against its SHA-256 before and after the copy
 * and only then points its row at Azure; it can be run again. `--vaciar`
 * checks each Azure copy once more and only then deletes its Postgres bytes.
 */
import { createHash } from 'node:crypto';

import { moverDocumentos } from '@xangarro/application/corp';
import {
  createCorpDb,
  createPgBlobStore,
  documentosEnAlmacen,
  marcarAlmacen,
} from '@xangarro/data-corp';
import postgres from 'postgres';

import { createAzureBlobs, type AzureBlobs } from '../src/server/blobs/azure';
import { blobConfig } from '../src/server/blobs/config';

const sha256 = async (b: Uint8Array) => createHash('sha256').update(b).digest('hex');

function requireEnv(): { readonly url: string; readonly azure: AzureBlobs } {
  const url = process.env.CORP_OWNER_DATABASE_URL ?? '';
  const config = blobConfig();
  if (url === '') throw new Error('CORP_OWNER_DATABASE_URL (the corp owner role) is required');
  if (config === null) throw new Error('CORP_BLOB_ACCOUNT and CORP_BLOB_KEY are required');
  return { url, azure: createAzureBlobs(config) };
}

async function aplicar(url: string, azure: AzureBlobs): Promise<number> {
  const db = createCorpDb(url);
  const r = await moverDocumentos({
    origen: createPgBlobStore(db),
    destino: azure.store,
    pendientes: () => documentosEnAlmacen(db, 'pg'),
    marcarMovido: (id, a) => marcarAlmacen(db, id, 'pg', a),
    sha256,
  });
  console.log(`movidos: ${r.movidos.length}`);
  for (const f of r.fallidos) console.error(`NO movido ${f.id}: ${f.motivo}`);
  return r.fallidos.length === 0 ? 0 : 1;
}

/** Deletes the Postgres bytes of every file whose Azure copy still matches. */
async function vaciar(url: string, azure: AzureBlobs): Promise<number> {
  const sql = postgres(url, { max: 1, onnotice: () => undefined });
  let fallas = 0;
  try {
    const filas = await sql<{ id: string; blob_key: string; sha256: string }[]>`
      SELECT d.id, d.blob_key, d.sha256 FROM corp.documents d
        JOIN corp.blobs b ON b.key = d.blob_key
       WHERE d.storage = 'azure'`;
    for (const f of filas) {
      const copia = await azure.store.leer(f.blob_key);
      if (copia === null || (await sha256(copia)) !== f.sha256) {
        console.error(`NO vaciado ${f.id}: la copia en Azure no coincide`);
        fallas += 1;
        continue;
      }
      await sql`DELETE FROM corp.blobs WHERE key = ${f.blob_key}`;
    }
    console.log(`vaciados: ${filas.length - fallas}`);
  } finally {
    await sql.end({ timeout: 5 });
  }
  return fallas === 0 ? 0 : 1;
}

async function contar(url: string): Promise<number> {
  const db = createCorpDb(url);
  const [pg, azure] = await Promise.all([
    documentosEnAlmacen(db, 'pg'),
    documentosEnAlmacen(db, 'azure'),
  ]);
  console.log(`en Postgres: ${pg.length} · en Azure: ${azure.length}`);
  console.log('Nada cambió. --aplicar copia y apunta; --vaciar borra los bytes ya copiados.');
  return 0;
}

async function main(): Promise<number> {
  const { url, azure } = requireEnv();
  const args = process.argv.slice(2);
  if (args.includes('--aplicar')) return aplicar(url, azure);
  if (args.includes('--vaciar')) return vaciar(url, azure);
  return contar(url);
}

main().then(
  (code) => process.exit(code),
  (error: unknown) => {
    console.error(`corp-blobs: ${error instanceof Error ? error.message : 'unknown error'}`);
    process.exit(1);
  },
);
