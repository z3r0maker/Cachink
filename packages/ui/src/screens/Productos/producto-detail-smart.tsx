/**
 * ProductoDetailSmart — wires the read-only ProductoDetailScreen to stock
 * movements (A-09): Entrada/Salida open MovimientoModal. No edit, no delete.
 */

import { useState, type ReactElement } from 'react';
import type { BusinessId, IsoDate, MovementType, NewInventoryMovement } from '@xangarro/domain';
import { useCurrentBusinessId } from '../../app-config/index';
import { useFeatureFlag } from '../../hooks/use-feature-flags';
import type { ProductoConStock } from '../../hooks/use-productos-con-stock';
import { useRegistrarMovimiento } from '../../hooks/use-registrar-movimiento';
import { MovimientoModal } from './movimiento-modal';
import { ProductoDetailScreen } from './producto-detail-screen';

export interface ProductoDetailSmartProps {
  readonly row: ProductoConStock;
  readonly fecha: IsoDate;
  readonly onBack: () => void;
  readonly testID?: string;
}

export function ProductoDetailSmart(props: ProductoDetailSmartProps): ReactElement {
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const registrar = useRegistrarMovimiento();
  const stockOn = useFeatureFlag('stock');
  const [movTipo, setMovTipo] = useState<MovementType | null>(null);
  const handleSubmit = (input: NewInventoryMovement): void => {
    registrar.mutate(input, { onSuccess: () => setMovTipo(null) });
  };
  return (
    <>
      <ProductoDetailScreen
        producto={props.row.producto}
        stock={props.row.stock}
        onEntrada={() => setMovTipo('entrada')}
        onSalida={() => setMovTipo('salida')}
        onBack={props.onBack}
        showStock={stockOn}
        testID={props.testID}
      />
      {businessId && movTipo && (
        <MovimientoModal
          open
          onClose={() => setMovTipo(null)}
          onSubmit={handleSubmit}
          producto={props.row.producto}
          businessId={businessId}
          fecha={props.fecha}
          initialTipo={movTipo}
          submitting={registrar.isPending}
        />
      )}
    </>
  );
}
