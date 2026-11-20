import { armarPaquete } from '@xangarro/application/corp';
import { ContadorError } from '@xangarro/domain/corp';

import { auditedMutation } from '@/server/audited';
import { hoyEnMexico } from '@/server/db/corp';
import { fuentesDelPaquete, zipDelPaquete } from '@/server/empresa/contador-paquete';
import { requireFounder } from '@/server/founder';

/**
 * «Descargar el paquete» (E-43, board CD-10d): the month's balanza, its
 * CFDIs, the received XMLs and the acuses in one .zip, built on each
 * download. To founders only; anyone else gets a 404, as every «Empresa»
 * page does. Each download is a `staff_audit_log` row: it carries the month's
 * whole fiscal record.
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
  const mes = new URL(request.url).searchParams.get('mes') ?? '';
  try {
    const { result: p } = await auditedMutation(
      (r: { tipo: string; archivos: readonly unknown[] }) => ({
        action: 'empresa.paquete_descargado',
        payload: { mes, tipo: r.tipo, archivos: r.archivos.length },
      }),
      () => armarPaquete(fuentesDelPaquete(), { mes, hoy: hoyEnMexico() }),
    );
    return new Response(new Uint8Array(zipDelPaquete(p, new Date())), {
      headers: {
        'content-type': 'application/zip',
        'content-disposition': `attachment; filename="${p.nombre}"`,
        'cache-control': 'private, no-store',
      },
    });
  } catch (error) {
    if (error instanceof ContadorError) return texto(400, error.message);
    throw error;
  }
}
