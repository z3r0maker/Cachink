import 'server-only';

import type { BlobStore } from '@xangarro/application/corp';
import { createPgBlobStore, type CorpDb } from '@xangarro/data-corp';
import { MAX_BYTES_EVIDENCIA } from '@xangarro/domain/corp';

import { type AzureBlobs, createAzureBlobs } from './azure';
import { blobConfig } from './config';

/**
 * Which `BlobStore` «Empresa» writes to and reads from (E-26). New files go to
 * Azure once it is configured, to Postgres until then; a kept file is read
 * from the store its row names, so both kinds open side by side while the
 * one-time move runs.
 */
let cached: AzureBlobs | null | undefined;

export function azureBlobs(): AzureBlobs | null {
  if (cached === undefined) {
    const config = blobConfig();
    cached = config === null ? null : createAzureBlobs(config);
  }
  return cached;
}

export function almacenParaNuevos(db: CorpDb): BlobStore {
  return azureBlobs()?.store ?? createPgBlobStore(db);
}

/** The largest file a form may carry now, in MB, for the field's hint. */
export function limiteMb(): number {
  return (azureBlobs()?.store.maxBytes ?? MAX_BYTES_EVIDENCIA) / (1024 * 1024);
}
