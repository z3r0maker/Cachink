/**
 * A sale must refresh the turno's ventas list (useCobrarTicket → ventas-turno).
 * TOCADAS matches keys by their first word and the list lives under caja's
 * keys, so the two drift apart silently; this pins the key shapes together.
 */
import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { BusinessId, UserId } from '@xangarro/domain';
import { teclasAlCobrar } from '../src/screens/Checkout/use-cobrar-ticket';
import { ventasTurnoKey } from '../src/screens/Ventas/use-ventas-turno';

describe('teclasAlCobrar', () => {
  it('invalidates the ventas-turno query the Ventas tab reads', async () => {
    const businessId = '01JBZN00000000000000000001' as BusinessId;
    const userId = '01JPRS00000000000000000002' as UserId;
    const qc = new QueryClient();
    const key = ventasTurnoKey(businessId, userId);
    await qc.prefetchQuery({
      queryKey: key,
      queryFn: async () => ({ turnoId: null, desde: null, ventas: [] }),
    });
    expect(qc.getQueryState(key)?.isInvalidated).toBe(false);

    for (const queryKey of teclasAlCobrar(businessId)) {
      await qc.invalidateQueries({ queryKey });
    }
    expect(qc.getQueryState(key)?.isInvalidated).toBe(true);
  });
});
