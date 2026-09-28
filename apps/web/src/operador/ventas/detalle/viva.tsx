'use client';

/**
 * `/ventas/[folio]` (O-22, real data O-34): the turno's list with that
 * ticket's side panel open (OpVentas). An unlinked browser keeps the design
 * fixtures and the route's forced state; a linked register reads its own
 * database, list and ticket alike.
 */

import type { ReactNode } from 'react';

import { VENTAS_FIXTURE, type DetalleScreenProps } from '@xangarro/caja/ventas';
import { VentasScreen } from '../screen';

export function DetalleVentaViva({
  folio,
  fixture,
  forzado = 'happy',
}: {
  readonly folio: string;
  readonly fixture: DetalleScreenProps;
  readonly forzado?: DetalleScreenProps['state'];
}): ReactNode {
  const venta = fixture.data.venta;
  return (
    <VentasScreen
      state="happy"
      data={VENTAS_FIXTURE}
      filtro="Todos"
      abierta={{ folio, state: forzado, ...(venta === null ? {} : { venta }) }}
    />
  );
}
