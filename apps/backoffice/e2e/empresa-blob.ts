import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { expect, type Page } from '@playwright/test';

/**
 * E-26 in the browser, when the run is pointed at a blob store (Azurite
 * locally: CORP_BLOB_ACCOUNT, CORP_BLOB_KEY, CORP_BLOB_URL). Without them
 * every upload goes to Postgres, as in the default run, and the Azure-only
 * test is skipped.
 */
const ACCOUNT = process.env.CORP_BLOB_ACCOUNT ?? '';
const KEY = process.env.CORP_BLOB_KEY ?? '';
const URL_BLOB = process.env.CORP_BLOB_URL ?? '';
export const CON_AZURE = ACCOUNT !== '' && KEY !== '' && URL_BLOB !== '';

/**
 * Containers and CORS as `scripts/corp-blob-provision.sh` leaves them, for the
 * test origin. One header more than production: the suite's
 * `extraHTTPHeaders` puts `x-forwarded-for` on every request the browser
 * makes, the PUT to the blob store included.
 */
const HEADERS_PERMITIDOS = 'x-ms-blob-type,content-type,x-forwarded-for';

export async function prepararAzurite(origin: string): Promise<void> {
  const service = new BlobServiceClient(URL_BLOB, new StorageSharedKeyCredential(ACCOUNT, KEY));
  for (const name of ['corp-docs', 'corp-entrantes']) {
    await service.getContainerClient(name).createIfNotExists();
  }
  await service.setProperties({
    cors: [
      {
        allowedOrigins: origin,
        allowedMethods: 'PUT',
        allowedHeaders: HEADERS_PERMITIDOS,
        exposedHeaders: '',
        maxAgeInSeconds: 3600,
      },
    ],
  });
}

const VEINTE_MB = 20 * 1024 * 1024;

/**
 * Files a 20 MB PDF from the Expediente and checks it never travelled through
 * the console: no request to the console carries more than a megabyte, and
 * the file went to the blob store with a PUT. Returns the new document's id.
 */
export async function subirVeinteMegas(page: Page): Promise<string> {
  const alConsola: number[] = [];
  const alAlmacen: string[] = [];
  page.on('request', (r) => {
    const size = r.postDataBuffer()?.byteLength ?? 0;
    if (r.url().startsWith(URL_BLOB)) alAlmacen.push(r.method());
    else alConsola.push(size);
  });
  await page.goto('/empresa/expediente/subir');
  await page.getByRole('combobox', { name: 'Carpeta' }).selectOption('contratos');
  await page
    .getByRole('textbox', { name: 'Nombre del documento', exact: true })
    .fill('E2E Deck de 20 MB');
  await expect(page.getByText('hasta 25 MB')).toBeVisible();
  const buffer = Buffer.alloc(VEINTE_MB, 0x20);
  buffer.write('%PDF-1.4\n');
  await page
    .getByLabel('Archivo')
    .setInputFiles({ name: 'deck.pdf', mimeType: 'application/pdf', buffer });
  await page.getByRole('button', { name: 'Subir documento' }).click();
  await expect(page).toHaveURL(/carpeta=contratos&doc=/, { timeout: 60_000 });
  expect(alAlmacen).toContain('PUT');
  expect(Math.max(...alConsola)).toBeLessThan(1024 * 1024);
  return new URL(page.url()).searchParams.get('doc') ?? '';
}

/** «Ver» on an Azure file is a redirect to a signed URL with the very bytes kept. */
export async function verDesdeElAlmacen(page: Page, id: string): Promise<void> {
  const res = await page.request.get(`/empresa/documentos/${id}`, { maxRedirects: 0 });
  expect(res.status()).toBe(302);
  const location = res.headers()['location'] ?? '';
  expect(location.startsWith(`${URL_BLOB}/corp-docs/`)).toBe(true);
  expect(location).toContain('sig=');
  const archivo = await page.request.get(location);
  expect(archivo.status()).toBe(200);
  expect((await archivo.body()).byteLength).toBe(VEINTE_MB);
}
