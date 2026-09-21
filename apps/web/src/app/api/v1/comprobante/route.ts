import { deviceRoute } from '@/server/api/device-route';
import { responderComprobante } from '@/server/comprobante/archivo';
import { comprobanteDeTicket, plantillaDelNegocio } from '@/server/comprobante/datos';
import { withTenant } from '@/server/db';

/**
 * `GET /api/v1/comprobante?ticketId=` — one venta's comprobante PNG, rendered
 * by the N-20 pipeline in the business's chosen template, for the linked
 * register's share dialog (N-21). Device-token authed like every /api/v1
 * route: the register has no portal session. 404 while the ticket has not
 * reached Postgres yet (captured offline, queue not flushed) — the dialog
 * falls back to its local canvas.
 */
export const GET = (request: Request): Promise<Response> =>
  deviceRoute(
    'comprobante',
    request,
    async ({ businessId }) => {
      const ticketId = new URL(request.url).searchParams.get('ticketId') ?? '';
      const hallado = await withTenant(businessId, async (tx) => {
        const c = await comprobanteDeTicket(tx, ticketId);
        return c === null ? null : { c, plantilla: await plantillaDelNegocio(tx) };
      });
      if (hallado === null) {
        return { response: Response.json({ error: 'No encontrado' }, { status: 404 }) };
      }
      if (hallado.c.cancelada) {
        return { response: Response.json({ error: 'Esa venta está cancelada' }, { status: 409 }) };
      }
      return { response: await responderComprobante(hallado.c, hallado.plantilla, 'png') };
    },
    'No pudimos preparar el comprobante.',
  );
