/**
 * ProductoDetailSmart — smart wrapper that wires mutations + state to
 * the pure ProductoDetailScreen.
 *
 * Handles: edit (save), entrada/salida (MovimientoModal), delete
 * (ConfirmDialog), and icon picker navigation (zustand store).
 */

import { useState, type ReactElement } from 'react';
import type { BusinessId, IsoDate, MovementType, NewInventoryMovement } from '@cachink/domain';
import { ConfirmDialog } from '../../components/index';
import { useCurrentBusinessId } from '../../app-config/index';
import { useEditarProducto } from '../../hooks/use-editar-producto';
import { useRegistrarMovimiento } from '../../hooks/use-registrar-movimiento';
import { useEliminarProducto } from '../../hooks/use-eliminar-producto';
import { useFeatureFlag } from '../../hooks/use-feature-flags';
import { useProductFormStore } from '../../hooks/use-product-form-store';
import { useTranslation } from '../../i18n/index';
import type { ProductoConStock } from '../../hooks/use-productos-con-stock';
import { MovimientoModal } from './movimiento-modal';
import { ProductoDetailScreen } from './producto-detail-screen';

export interface ProductoDetailSmartProps {
  readonly row: ProductoConStock;
  readonly fecha: IsoDate;
  readonly onBack: () => void;
  readonly onSelectIcon: () => void;
  readonly testID?: string;
}

function useDetailMutations(row: ProductoConStock, onBack: () => void) {
  const editar = useEditarProducto();
  const registrar = useRegistrarMovimiento();
  const eliminar = useEliminarProducto();
  const [movTipo, setMovTipo] = useState<MovementType | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const handleSave = (patch: Parameters<typeof editar.mutate>[0]['patch']): void => {
    editar.mutate({ id: row.producto.id, patch }, { onSuccess: onBack });
  };
  const handleMovSubmit = (input: NewInventoryMovement): void => {
    registrar.mutate(input, { onSuccess: () => setMovTipo(null) });
  };
  const handleConfirmDelete = (): void => {
    eliminar.mutate(
      { id: row.producto.id, currentStock: row.stock, force: true },
      { onSuccess: onBack },
    );
  };

  return {
    editar,
    registrar,
    eliminar,
    movTipo,
    setMovTipo,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    handleSave,
    handleMovSubmit,
    handleConfirmDelete,
  };
}

function DetailDialogs(props: {
  row: ProductoConStock;
  fecha: IsoDate;
  businessId: BusinessId | null;
  m: ReturnType<typeof useDetailMutations>;
}): ReactElement {
  const { t } = useTranslation();
  const { m, row } = props;
  const hasStock = row.stock > 0;
  return (
    <>
      <ConfirmDialog
        open={m.confirmDeleteOpen}
        onClose={() => m.setConfirmDeleteOpen(false)}
        onConfirm={m.handleConfirmDelete}
        title={hasStock ? t('inventario.deleteBlockedTitle') : t('inventario.deleteConfirmTitle')}
        description={hasStock ? t('inventario.deleteBlockedBody') : t('inventario.deleteConfirmBody')}
        confirmLabel={t('actions.delete')}
        tone="danger"
      />
      {props.businessId && m.movTipo && (
        <MovimientoModal
          open
          onClose={() => m.setMovTipo(null)}
          onSubmit={m.handleMovSubmit}
          producto={row.producto}
          businessId={props.businessId}
          fecha={props.fecha}
          initialTipo={m.movTipo}
          submitting={m.registrar.isPending}
        />
      )}
    </>
  );
}

export function ProductoDetailSmart(props: ProductoDetailSmartProps): ReactElement {
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const conversionEnabled = useFeatureFlag('conversionMateriaPrima');
  const iconOverride = useProductFormStore((s) => s.draft?.icono);
  const m = useDetailMutations(props.row, props.onBack);

  return (
    <>
      <ProductoDetailScreen
        producto={props.row.producto}
        stock={props.row.stock}
        conversionEnabled={conversionEnabled}
        onSave={m.handleSave}
        saving={m.editar.isPending}
        onEntrada={() => m.setMovTipo('entrada')}
        onSalida={() => m.setMovTipo('salida')}
        onDelete={() => m.setConfirmDeleteOpen(true)}
        deleting={m.eliminar.isPending}
        onSelectIcon={props.onSelectIcon}
        onBack={props.onBack}
        iconOverride={iconOverride}
        testID={props.testID}
      />
      <DetailDialogs
        row={props.row}
        fecha={props.fecha}
        businessId={businessId}
        m={m}
      />
    </>
  );
}
