import { NextResponse } from 'next/server';

import { formatoValido, plantillaValida, responderComprobante } from '@/server/comprobante/archivo';
import { comprobanteDeMuestra } from '@/server/comprobante/datos';
import { withTenant } from '@/server/db';
import { readSession } from '@/server/session';

/**
 * `GET /api/comprobantes/muestra?plantilla=&formato=` — the Comprobantes
 * screen's own preview as a real file (N-20): the business's branding over
 * its last ticket, or the demo venta when it has none. Every role: the
 * screen is read-only for viewers and this reads nothing they can't see.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const session = await readSession();
  if (session === null) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  const url = new URL(request.url);
  const formato = url.searchParams.get('formato');
  if (!formatoValido(formato)) {
    return NextResponse.json({ error: 'formato debe ser png o pdf' }, { status: 400 });
  }
  const plantilla = plantillaValida(url.searchParams.get('plantilla'));
  if (plantilla === null) {
    return NextResponse.json({ error: 'plantilla no válida' }, { status: 400 });
  }
  const c = await withTenant(session.business_id, (tx) => comprobanteDeMuestra(tx));
  return responderComprobante(c, plantilla, formato);
}
