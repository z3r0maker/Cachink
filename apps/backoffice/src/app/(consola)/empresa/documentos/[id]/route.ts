import { createDocumentRepository, createPgBlobStore } from '@xangarro/data-corp';

import { azureBlobs } from '@/server/blobs';
import { requireCorpDb } from '@/server/db/corp';
import { requireFounder } from '@/server/founder';

/**
 * «Ver» on a kept document (E-04, E-05, E-26): to founders only; anyone else
 * gets a 404, as every «Empresa» page does. A file in the Postgres store is
 * served from here, sandboxed: a PDF or an XML from the SAT is shown, never
 * run. A file in Azure is a redirect to a URL that works for ten minutes, on
 * the storage account's own origin, so up to 25 MB never passes through the
 * console.
 */
export const dynamic = 'force-dynamic';

const notFound = () => new Response('No encontrado', { status: 404 });

/** Only letters, digits and a few marks survive into the header. */
const safeName = (name: string) => name.replace(/[^\w.\- ]+/g, '_').slice(0, 120) || 'documento';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    await requireFounder();
  } catch {
    return notFound();
  }
  const { id } = await params;
  const db = requireCorpDb();
  const pg = createPgBlobStore(db);
  const meta = await createDocumentRepository(db, pg).porId(id);
  if (meta === null) return notFound();
  const nombre = safeName(meta.nombre);
  if (meta.almacen === 'azure') {
    const azure = azureBlobs();
    if (azure === null) return notFound();
    const url = azure.urlDeLectura(meta.blobKey, nombre, meta.mime);
    return new Response(null, {
      status: 302,
      headers: { location: url, 'cache-control': 'private, no-store' },
    });
  }
  const bytes = await pg.leer(meta.blobKey);
  if (bytes === null) return notFound();
  return new Response(new Uint8Array(bytes), {
    headers: {
      'content-type': meta.mime,
      'content-length': String(meta.tamano),
      'content-disposition': `inline; filename="${nombre}"`,
      'content-security-policy': 'sandbox',
      'cache-control': 'private, no-store',
    },
  });
}
