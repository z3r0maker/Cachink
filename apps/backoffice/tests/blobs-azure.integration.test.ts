import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';

import { ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { newUlid } from '@xangarro/domain';
import { beforeAll, describe, it } from 'vitest';

import {
  type AzureBlobs,
  CONTENEDOR_DOCS,
  CONTENEDOR_ENTRANTES,
  createAzureBlobs,
} from '../src/server/blobs/azure';
import type { BlobConfig } from '../src/server/blobs/config';

/**
 * The Azure `BlobStore` and the browser's inbox (E-26), against Azurite:
 * `AZURITE_BLOB_URL=http://127.0.0.1:10007/devstoreaccount1`. Without it the
 * suite is skipped. Azurite does not enforce immutability policies, so the
 * five-year lock itself is proven only against the real container
 * (`scripts/corp-blob-provision.sh` prints the check).
 */
const URL_AZURITE = process.env.AZURITE_BLOB_URL ?? '';
const suite = URL_AZURITE === '' ? describe.skip : describe;

/** Azurite's published development account; not a secret. */
const CONFIG: BlobConfig = {
  account: 'devstoreaccount1',
  key: 'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==',
  url: URL_AZURITE,
};

const pdf = (bytes: number) => {
  const b = randomBytes(bytes);
  b.set(Buffer.from('%PDF'));
  return new Uint8Array(b);
};

const put = (url: string, body: Uint8Array) =>
  fetch(url, {
    method: 'PUT',
    body: Buffer.from(body),
    headers: { 'x-ms-blob-type': 'BlockBlob', 'content-type': 'application/pdf' },
  });

suite('Azure blob store (Azurite)', () => {
  // Built in beforeAll: a skipped suite still runs this body, without a URL.
  let azure: AzureBlobs;

  beforeAll(async () => {
    azure = createAzureBlobs(CONFIG);
    const credential = new StorageSharedKeyCredential(CONFIG.account, CONFIG.key);
    for (const name of [CONTENEDOR_DOCS, CONTENEDOR_ENTRANTES]) {
      await new ContainerClient(`${CONFIG.url}/${name}`, credential).createIfNotExists();
    }
  });

  it('keeps a file and gives back the same bytes', async () => {
    const key = newUlid();
    const bytes = pdf(2048);
    await azure.store.guardar(key, bytes, 'application/pdf');
    assert.deepEqual(await azure.store.leer(key), bytes);
    assert.equal(await azure.store.leer(newUlid()), null);
  });

  it('refuses a second write under one key, and keeps the first', async () => {
    const key = newUlid();
    const first = pdf(64);
    await azure.store.guardar(key, first, 'application/pdf');
    await assert.rejects(azure.store.guardar(key, pdf(64), 'application/pdf'));
    assert.deepEqual(await azure.store.leer(key), first);
  });

  it('takes a 20 MB file from the browser straight into the inbox', async () => {
    const firma = azure.firmarSubida();
    const bytes = pdf(20 * 1024 * 1024);
    const res = await put(firma.url, bytes);
    assert.equal(res.status, 201);
    assert.deepEqual(await azure.leerSubida(firma.key), bytes);
  });

  it('gives the inbox URL no right to read, and reads nothing from a made-up key', async () => {
    const firma = azure.firmarSubida();
    await put(firma.url, pdf(16));
    assert.equal((await fetch(firma.url)).status, 403);
    assert.equal(await azure.leerSubida('../corp-docs/x'), null);
    assert.equal(await azure.leerSubida(newUlid()), null);
  });

  it('refuses to read back a file over 25 MB from the inbox', async () => {
    const firma = azure.firmarSubida();
    await put(firma.url, pdf(25 * 1024 * 1024 + 1));
    assert.equal(await azure.leerSubida(firma.key), null);
  });

  it('shows a kept file inline under its own name, and only while the URL is fresh', async () => {
    const key = newUlid();
    const bytes = pdf(128);
    await azure.store.guardar(key, bytes, 'application/pdf');
    const res = await fetch(azure.urlDeLectura(key, 'acta.pdf', 'application/pdf'));
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-disposition'), 'inline; filename="acta.pdf"');
    assert.deepEqual(new Uint8Array(await res.arrayBuffer()), bytes);

    const ayer = createAzureBlobs(CONFIG, () => new Date(Date.now() - 24 * 3_600_000));
    assert.equal((await fetch(ayer.urlDeLectura(key, 'acta.pdf', 'application/pdf'))).status, 403);
  });
});
