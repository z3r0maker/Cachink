import { prepararAviso } from '@xangarro/application/corp';
import { buildAvisoPdf } from '@xangarro/application/corp-pdf';
import { fechaEnTexto, TableroError, textoDelAviso, trimestreDe } from '@xangarro/domain/corp';

import { hoyEnMexico } from '@/server/db/corp';
import { leerElTablero } from '@/server/empresa/tablero-lectura';
import { requireFounder } from '@/server/founder';

/**
 * «Descargar el PDF» (E-20, board CD-13d): the incumplimiento notice's draft,
 * dated today, from the decided quarter. To founders only; anyone else gets a
 * 404, as every «Empresa» page does. The copy filed when it is marked sent is
 * the Expediente's own, under «Acuerdo de socios».
 */
export const dynamic = 'force-dynamic';

const texto = (status: number, cuerpo: string) =>
  new Response(cuerpo, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  });

export async function GET(request: Request): Promise<Response> {
  try {
    await requireFounder();
  } catch {
    return texto(404, 'No encontrado');
  }
  const hoy = hoyEnMexico();
  const t = new URL(request.url).searchParams.get('t') ?? '';
  if (!/^\d{4}-T[1-4]$/.test(t) || t >= trimestreDe(hoy))
    return texto(400, 'Elige un trimestre que ya terminó.');
  try {
    const l = await leerElTablero(hoy, t);
    const aviso = prepararAviso(l.datos, t, hoy);
    const pdf = await buildAvisoPdf(textoDelAviso(aviso, l.nombres), fechaEnTexto(hoy));
    return new Response(new Uint8Array(pdf), {
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="aviso-incumplimiento-${t}.pdf"`,
        'cache-control': 'private, no-store',
      },
    });
  } catch (error) {
    if (error instanceof TableroError) return texto(400, error.message);
    throw error;
  }
}
