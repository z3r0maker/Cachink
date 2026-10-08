/**
 * The business's credit accounts from the phone's repositories (Track M,
 * M-08): every client with their Crédito tickets and abonos, assembled by
 * `@xangarro/caja`'s `cuentaPara` exactly as the web caja's Worker does
 * (`runtime/cuentas.ts`), so the saldo is the domain's `estadoDeCuenta` on
 * both. Fiado y abonos, Inicio's «Por cobrar» and the fiado picker read it.
 */
import {
  capturoDe,
  cuentaPara,
  totalDeLineas,
  type ClienteCuentaFila,
  type CuentaPara,
} from '@xangarro/caja/lectura';
import type { BusinessId, ClientId, TicketId, UserId } from '@xangarro/domain';
import type { Repositories } from '../../app/repository-provider';

export type ReposCuentas = Pick<
  Repositories,
  'clients' | 'tickets' | 'sales' | 'clientPayments' | 'users'
>;

/** «Ana Robledo · Caja 1», one lookup per user however many tickets they took. */
function capturos(r: ReposCuentas): (userId: string | null) => Promise<string> {
  const vistos = new Map<string, Promise<string>>();
  return (userId) => {
    if (userId === null) return Promise.resolve(capturoDe(null, null));
    const hit = vistos.get(userId);
    if (hit) return hit;
    const p = r.users.findById(userId as UserId).then((u) => capturoDe(userId, u?.nombre));
    vistos.set(userId, p);
    return p;
  };
}

async function cuentaDe(
  c: ClienteCuentaFila,
  r: ReposCuentas,
  capturo: (userId: string | null) => Promise<string>,
): Promise<CuentaPara> {
  const [ventas, abonos] = await Promise.all([
    r.tickets.findCreditoByClient(c.id as ClientId),
    r.clientPayments.findByCliente(c.id as ClientId),
  ]);
  const par = <T>(id: string, v: Promise<T>) => v.then((x) => [id, x] as const);
  const [montos, quien] = await Promise.all([
    Promise.all(
      ventas.map((t) => par(t.id, r.sales.findByTicket(t.id as TicketId).then(totalDeLineas))),
    ),
    Promise.all(ventas.map((t) => par(t.id, capturo(t.createdByUserId)))),
  ]);
  return cuentaPara({
    cliente: c,
    ventas,
    montos: new Map(montos),
    abonos,
    capturos: new Map(quien),
  });
}

/** All the business's accounts, in the repository's order. */
export async function leerCuentas(
  r: ReposCuentas,
  businessId: BusinessId,
): Promise<readonly CuentaPara[]> {
  const clientes = await r.clients.findByName('', businessId);
  const capturo = capturos(r);
  return Promise.all(clientes.map((c) => cuentaDe(c, r, capturo)));
}
