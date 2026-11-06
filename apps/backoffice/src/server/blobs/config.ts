/**
 * «Empresa»'s Azure Blob storage account (E-26, ADR-127 §4), from the
 * environment. Unset means there is no Azure yet: documents keep going to the
 * Postgres store, exactly as before. Never read by client code.
 *
 * - `CORP_BLOB_ACCOUNT`: the storage account's name.
 * - `CORP_BLOB_KEY`: its access key, used only to sign short-lived SAS URLs
 *   and for the console's own writes; the containers' locked immutability
 *   policy refuses an overwrite or a delete whatever key asks.
 * - `CORP_BLOB_URL`: the blob endpoint, when it is not
 *   `https://<account>.blob.core.windows.net` (Azurite in tests).
 */
export interface BlobConfig {
  readonly account: string;
  readonly key: string;
  /** The blob endpoint, without a trailing slash. */
  readonly url: string;
}

export function blobConfig(env: NodeJS.ProcessEnv = process.env): BlobConfig | null {
  const account = env.CORP_BLOB_ACCOUNT ?? '';
  const key = env.CORP_BLOB_KEY ?? '';
  if (account === '' || key === '') return null;
  const url = (env.CORP_BLOB_URL || `https://${account}.blob.core.windows.net`).replace(/\/+$/, '');
  return { account, key, url };
}

/** The origin the browser sends files to, for the CSP's `connect-src`; none without Azure. */
export function blobOrigins(env: NodeJS.ProcessEnv = process.env): readonly string[] {
  const config = blobConfig(env);
  return config === null ? [] : [new URL(config.url).origin];
}
