/**
 * A sale must refresh every read the caja keeps (useCobrarTicket): the
 * turno's ventas list, Mi turno, Inicio, Inventario and the fiado accounts.
 * TOCADAS matches keys by their first word and these live under caja's keys,
 * which never go stale on their own (staleTime: Infinity) — so a screen that
 * was open before the sale kept its old figures until the app restarted
 * (catalogue F12). This pins the key shapes together.
 */
import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { BusinessId, DeviceId, UserId } from '@xangarro/domain';
import { teclasAlCobrar } from '../src/screens/Checkout/use-cobrar-ticket';
import { cobranzaKey } from '../src/screens/Cobranza/use-cobranza';
import { inicioKey } from '../src/screens/Inicio/use-inicio';
import { inventarioKey } from '../src/screens/Inventario/use-inventario';
import { miTurnoKey } from '../src/screens/Turno/use-mi-turno';
import { ventasTurnoKey } from '../src/screens/Ventas/use-ventas-turno';

const businessId = '01JBZN00000000000000000001' as BusinessId;
const userId = '01JPRS00000000000000000002' as UserId;
const deviceId = '01JDEV00000000000000000001' as DeviceId;

const LECTURAS: readonly (readonly [string, readonly unknown[]])[] = [
  ['the ventas-turno list the Ventas tab reads', ventasTurnoKey(businessId, userId)],
  ['Mi turno', [...miTurnoKey(businessId, userId), '2026-11-06']],
  ['Inicio', [...inicioKey(businessId, userId), '2026-11-06']],
  ['Inventario', [...inventarioKey(businessId, userId, deviceId), '2026-11-06']],
  ['the fiado accounts', [...cobranzaKey(businessId), '2026-11-06', 'Caja 1']],
];

async function alCobrar(qc: QueryClient, negocio: BusinessId | null): Promise<void> {
  for (const queryKey of teclasAlCobrar(negocio)) {
    await qc.invalidateQueries({ queryKey });
  }
}

describe('teclasAlCobrar', () => {
  it.each(LECTURAS)('invalidates %s', async (_nombre, key) => {
    const qc = new QueryClient();
    await qc.prefetchQuery({ queryKey: key, queryFn: async () => ({}) });
    expect(qc.getQueryState(key)?.isInvalidated).toBe(false);

    await alCobrar(qc, businessId);
    expect(qc.getQueryState(key)?.isInvalidated).toBe(true);
  });

  it('leaves another business’s caja alone', async () => {
    const qc = new QueryClient();
    const otro = '01JBZN00000000000000000002' as BusinessId;
    const key = [...miTurnoKey(otro, userId), '2026-11-06'];
    await qc.prefetchQuery({ queryKey: key, queryFn: async () => ({}) });

    await alCobrar(qc, businessId);
    expect(qc.getQueryState(key)?.isInvalidated).toBe(false);
  });

  it('leaves reads outside the caja alone', async () => {
    const qc = new QueryClient();
    const key = ['appConfig', 'deviceId'];
    await qc.prefetchQuery({ queryKey: key, queryFn: async () => 'x' });

    await alCobrar(qc, businessId);
    expect(qc.getQueryState(key)?.isInvalidated).toBe(false);
  });

  it('without a business it still names a caja prefix, and matches nothing live', async () => {
    const qc = new QueryClient();
    const key = [...inicioKey(businessId, userId), '2026-11-06'];
    await qc.prefetchQuery({ queryKey: key, queryFn: async () => ({}) });

    await alCobrar(qc, null);
    expect(qc.getQueryState(key)?.isInvalidated).toBe(false);
  });
});
