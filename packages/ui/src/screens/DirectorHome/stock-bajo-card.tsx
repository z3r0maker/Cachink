/**
 * StockBajoCard — Director Home wrapper around StockBajoSummary
 * (P1C-M10-T05, S4-C6).
 *
 * Consumes `useProductosConStock()` and renders the existing
 * StockBajoSummary. Routes "Ver bajo stock" to the Inventario tab
 * filtered by bajoStock.
 */

import type { ReactElement } from 'react';
import { useProductosConStock } from '../../hooks/index';
import { StockBajoSummary } from '../Inventario/stock-bajo-summary';

export interface StockBajoCardProps {
  readonly onVerBajoStock?: () => void;
  readonly testID?: string;
}

export function StockBajoCard(props: StockBajoCardProps): ReactElement | null {
  const query = useProductosConStock();
  return (
    <StockBajoSummary
      items={query.data ?? []}
      onVer={props.onVerBajoStock}
      testID={props.testID ?? 'stock-bajo-card'}
    />
  );
}
