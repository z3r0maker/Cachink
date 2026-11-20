import { leerEstadoDeCodigos } from '@xangarro/application/corp';
import { createCodigosRepository } from '@xangarro/data-corp';
import { listaDeCuentasCsv } from '@xangarro/domain/corp';

import { requireCorpDb } from '@/server/db/corp';
import { requireFounder } from '@/server/founder';

/**
 * «Descargar la lista para el contador» (E-43, board CD-10e): the console's
 * accounts with their group, side and the codes saved so far, as CSV.
 * To founders only; anyone else gets a 404.
 */
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  try {
    await requireFounder();
  } catch {
    return new Response('No encontrado', { status: 404 });
  }
  const { lista } = await leerEstadoDeCodigos(createCodigosRepository(requireCorpDb()));
  return new Response(listaDeCuentasCsv(lista?.codigos ?? new Map()), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="mexia-cuentas-para-el-contador.csv"',
      'cache-control': 'private, no-store',
    },
  });
}
