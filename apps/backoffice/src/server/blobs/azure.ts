import {
  BlobSASPermissions,
  ContainerClient,
  generateBlobSASQueryParameters,
  RestError,
  SASProtocol,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import type { BlobStore } from '@xangarro/application/corp';
import { newUlid } from '@xangarro/domain';
import { MAX_BYTES_DIRECTO } from '@xangarro/domain/corp';

import type { BlobConfig } from './config';

/**
 * Azure Blob for «Empresa»'s documents (E-26, ADR-127 §4):
 *
 * - `corp-docs` keeps the files, under a locked time-based immutability policy
 *   of five years (CFF art. 30): no overwrite, no delete, whoever asks. Only the
 *   console writes here, after it has checked and hashed the file.
 * - `corp-entrantes` is the inbox the browser uploads to with a short-lived SAS
 *   URL, so a 20 MB file never passes through the console's 4.5 MB request cap.
 *   A lifecycle rule empties it after a day.
 */
export const CONTENEDOR_DOCS = 'corp-docs';
export const CONTENEDOR_ENTRANTES = 'corp-entrantes';

/** How long a signed URL works: long enough for a slow upload, short enough to be useless later. */
const MINUTOS_SAS = 10;
const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/;

export interface SubidaFirmada {
  readonly key: string;
  readonly url: string;
}

export interface AzureBlobs {
  readonly store: BlobStore;
  /** A one-time upload URL into the inbox, for a new key. */
  firmarSubida(): SubidaFirmada;
  /** The bytes the browser left in the inbox, or null when nothing (or too much) is there. */
  leerSubida(key: string): Promise<Uint8Array | null>;
  /** A short-lived URL that shows a kept file inline; `nombre` must already be header-safe. */
  urlDeLectura(key: string, nombre: string, mime: string): string;
}

const noExiste = (error: unknown) => error instanceof RestError && error.statusCode === 404;

async function descargar(container: ContainerClient, key: string): Promise<Uint8Array | null> {
  try {
    const blob = container.getBlockBlobClient(key);
    const { contentLength } = await blob.getProperties();
    if (contentLength === undefined || contentLength > MAX_BYTES_DIRECTO) return null;
    return new Uint8Array(await blob.downloadToBuffer());
  } catch (error) {
    if (noExiste(error)) return null;
    throw error;
  }
}

/** Signs a SAS query string for one blob, valid from a minute ago for `MINUTOS_SAS`. */
function firmador(config: BlobConfig, credential: StorageSharedKeyCredential, now: () => Date) {
  const protocol = config.url.startsWith('https:') ? SASProtocol.Https : SASProtocol.HttpsAndHttp;
  return (
    containerName: string,
    blobName: string,
    permissions: string,
    extra: { contentDisposition?: string; contentType?: string } = {},
  ): string => {
    const t = now().getTime();
    return generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse(permissions),
        startsOn: new Date(t - 60_000),
        expiresOn: new Date(t + MINUTOS_SAS * 60_000),
        protocol,
        ...extra,
      },
      credential,
    ).toString();
  };
}

export function createAzureBlobs(
  config: BlobConfig,
  now: () => Date = () => new Date(),
): AzureBlobs {
  const credential = new StorageSharedKeyCredential(config.account, config.key);
  const docs = new ContainerClient(`${config.url}/${CONTENEDOR_DOCS}`, credential);
  const entrantes = new ContainerClient(`${config.url}/${CONTENEDOR_ENTRANTES}`, credential);
  const firmar = firmador(config, credential, now);
  return {
    store: {
      almacen: 'azure',
      maxBytes: MAX_BYTES_DIRECTO,
      async guardar(key, bytes, mime) {
        // `If-None-Match: *` refuses a second write even before the policy does.
        await docs.getBlockBlobClient(key).uploadData(bytes, {
          blobHTTPHeaders: { blobContentType: mime },
          conditions: { ifNoneMatch: '*' },
        });
      },
      leer: (key) => descargar(docs, key),
    },
    firmarSubida() {
      const key = newUlid();
      const sas = firmar(CONTENEDOR_ENTRANTES, key, 'cw');
      return { key, url: `${entrantes.url}/${key}?${sas}` };
    },
    leerSubida: (key) => (ULID.test(key) ? descargar(entrantes, key) : Promise.resolve(null)),
    urlDeLectura(key, nombre, mime) {
      const sas = firmar(CONTENEDOR_DOCS, key, 'r', {
        contentDisposition: `inline; filename="${nombre}"`,
        contentType: mime,
      });
      return `${docs.url}/${encodeURIComponent(key)}?${sas}`;
    },
  };
}
