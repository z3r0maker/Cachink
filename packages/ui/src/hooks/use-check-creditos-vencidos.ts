/**
 * `useCheckCreditosVencidos` — scheduled check that emits
 * `credito-vencido` alerts for Crédito sales older than 30 days
 * with `estadoPago = 'pendiente'`.
 *
 * Runs on Director Home mount, similar to `useScheduleStockLowCheck`.
 * Deduplication prevents duplicate alerts for the same sale.
 *
 * Phase 11 — Director Notification Inbox.
 */

import { useEffect, useRef } from 'react';
import type { BusinessId, Sale } from '@cachink/domain';
import { useSalesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { useRole } from '../app-config/index';
import { useEmitDirectorAlert } from './use-emit-director-alert';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function useCheckCreditosVencidos(): void {
  const role = useRole();
  const businessId = useCurrentBusinessId();
  const salesRepo = useSalesRepository();
  const emitAlert = useEmitDirectorAlert();
  // Stable ref to avoid stale-closure on the mutation object which changes every render
  const emitRef = useRef(emitAlert.mutate);
  emitRef.current = emitAlert.mutate;

  const hasRun = useRef(false);

  useEffect(() => {
    if (role !== 'director' || !businessId || hasRun.current) return;
    hasRun.current = true;

    void checkOverdue();

    async function checkOverdue(): Promise<void> {
      const bid = businessId as BusinessId;
      // Query a wide date range — last 90 days of sales
      const now = new Date();
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const from = ninetyDaysAgo.toISOString().slice(0, 10);
      const to = now.toISOString().slice(0, 10);

      const allSales = await salesRepo.findByDateRange(from, to, bid);

      const overdue = allSales.filter((s: Sale) => {
        if (s.metodo !== 'Crédito') return false;
        if (s.estadoPago === 'pagado') return false;
        const saleDate = new Date(s.fecha).getTime();
        return now.getTime() - saleDate > THIRTY_DAYS_MS;
      });

      for (const sale of overdue) {
        emitRef.current({
          source: 'credito-vencido',
          severity: 'critical',
          titleKey: 'notificaciones.creditoVencido',
          message: `Venta a crédito de ${sale.concepto} (${sale.fecha}) lleva más de 30 días sin pago.`,
          actionRoute: '/ventas-credito',
          metadata: JSON.stringify({ saleId: sale.id, fecha: sale.fecha }),
          dedupeKey: sale.id as string,
        });
      }
    }
  }, [role, businessId, salesRepo]);
}
