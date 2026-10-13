import { contenidoDe } from '@xangarro/data-corp';

import { requireCorpDb } from '@/server/db/corp';
import { requireFounder } from '@/server/founder';

/**
 * «Ver» on a kept document (E-04, E-05): its bytes, to founders only. Anyone
 * else gets a 404, as every «Empresa» page does. The file is served
 * sandboxed: a PDF or an XML from the SAT is shown, never run.
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
  const doc = await contenidoDe(requireCorpDb(), id);
  if (doc === null) return notFound();
  return new Response(new Uint8Array(doc.contenido), {
    headers: {
      'content-type': doc.meta.mime,
      'content-length': String(doc.meta.tamano),
      'content-disposition': `inline; filename="${safeName(doc.meta.nombre)}"`,
      'content-security-policy': 'sandbox',
      'cache-control': 'private, no-store',
    },
  });
}
