/**
 * Reads the phone's credit accounts (M-08): every client of the business
 * with their fiado tickets (each header plus its lines' total), their
 * abonos and who captured each ticket — the two facts an account is
 * (ADR-074) — then `comoCuenta` says them the way the web's register does.
 */
import { comoCuenta, type CuentaCliente, type FilaCuenta } from '@xangarro/caja/cobranza';
import type { BusinessId, Client, UserId } from '@xangarro/domain';
import type { Repositories } from '../../app/repository-provider';

type R = Pick<Repositories, 'clients' | 'tickets' | 'sales' | 'clientPayments' | 'users'>;

/** «Ana Robledo · Caja 1»: the caja's name beside whoever captured it. */
async function capturoDe(r: R, userId: UserId | null, caja: string): Promise<string> {
  if (userId === null) return caja;
  const nombre = (await r.users.findById(userId))?.nombre;
  return nombre === undefined ? caja : `${nombre} · ${caja}`;
}

/** A ticket's amount is what its lines say; the header carries no total. */
async function montoDe(r: R, ticketId: string): Promise<bigint> {
  const lineas = await r.sales.findByTicket(ticketId as never);
  return lineas.reduce((acc, l) => acc + (l.monto as bigint), 0n);
}

async function cuentaDe(r: R, c: Client, hoy: string, caja: string): Promise<CuentaCliente> {
  const [ventas, abonos] = await Promise.all([
    r.tickets.findCreditoByClient(c.id as never),
    r.clientPayments.findByCliente(c.id as never),
  ]);
  const fila: FilaCuenta = {
    id: c.id,
    nombre: c.nombre,
    telefono: c.telefono,
    creado: c.createdAt,
    limite: c.limiteCentavos,
    plazoDias: c.plazoDias,
    ventas: await Promise.all(
      ventas.map(async (t) => ({
        folio: t.folio,
        concepto: t.concepto,
        fecha: t.fecha,
        hora: t.hora,
        monto: await montoDe(r, t.id),
        capturo: await capturoDe(r, t.createdByUserId, caja),
      })),
    ),
    abonos: abonos.map((a) => ({
      id: a.id,
      fecha: a.fecha,
      monto: a.montoCentavos,
      metodo: a.metodo,
      nota: a.nota,
    })),
  };
  return comoCuenta(fila, hoy);
}

/** Every account of the business, oldest client first by name. */
export async function leerCuentas(
  r: R,
  businessId: BusinessId,
  hoy: string,
  caja: string,
): Promise<readonly CuentaCliente[]> {
  const rows = await r.clients.findByName('', businessId);
  const cuentas = await Promise.all(rows.map((c) => cuentaDe(r, c, hoy, caja)));
  return [...cuentas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-MX'));
}
