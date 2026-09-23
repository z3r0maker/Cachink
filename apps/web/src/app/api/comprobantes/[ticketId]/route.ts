import { NextResponse } from 'next/server';

import { formatoValido, responderComprobante } from '@/server/comprobante/archivo';
import { comprobanteDeTicket } from '@/server/comprobante/datos';
import { plantillaDelNegocio } from '@/server/comprobante/datos';
import { COMPROBANTES_PAUSADOS, comprobantesPausados } from '@/server/comprobante/pausa';
import { withTenant } from '@/server/db';
import { readSession } from '@/server/session';

/**
 * `GET /api/comprobantes/<ticketId>?formato=png|pdf` — one venta's
 * comprobante (N-20's salida; N-21 points WhatsApp at this URL). Always
 * the business's chosen template; cancelled tickets never receipt.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> },
): Promise<NextResponse> {
  const session = await readSession();
  if (session === null) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  const formato = new URL(request.url).searchParams.get('formato');
  if (!formatoValido(formato)) {
    return NextResponse.json({ error: 'formato debe ser png o pdf' }, { status: 400 });
  }
  const { ticketId } = await params;
  const resultado = await withTenant(session.business_id, async (tx) => {
    if (await comprobantesPausados(tx, session.business_id)) return 'pausa' as const;
    const c = await comprobanteDeTicket(tx, ticketId);
    return c === null ? null : { c, plantilla: await plantillaDelNegocio(tx) };
  });
  if (resultado === 'pausa') {
    return NextResponse.json({ error: COMPROBANTES_PAUSADOS }, { status: 503 });
  }
  if (resultado === null) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }
  if (resultado.c.cancelada) {
    return NextResponse.json({ error: 'Esa venta está cancelada' }, { status: 409 });
  }
  return responderComprobante(resultado.c, resultado.plantilla, formato);
}
