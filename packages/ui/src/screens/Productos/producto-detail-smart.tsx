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

export function ProductoDetailSmart(
  props: ProductoDetailSmartProps,
): ReactElement {
  const { t } = useTranslation();
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const editar = useEditarProducto();
  const registrar = useRegistrarMovimiento();
  const eliminar = useEliminarProducto();
  const conversionEnabled = useFeatureFlag('conversionMateriaPrima');
  const iconOverride = useProductFormStore((s) => s.draft?.icono);

  const [movTipo, setMovTipo] = useState<MovementType | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const handleSave = (patch: Parameters<typeof editar.mutate>[0]['patch']): void => {
    editar.mutate(
      { id: props.row.producto.id, patch },
      { onSuccess: () => props.onBack() },
    );
  };

  const handleMovSubmit = (input: NewInventoryMovement): void => {
    registrar.mutate(input, { onSuccess: () => setMovTipo(null) });
  };

  const handleConfirmDelete = (): void => {
    eliminar.mutate(
      { id: props.row.producto.id, currentStock: props.row.stock, force: true },
      { onSuccess: () => props.onBack() },
    );
  };

  const hasStock = props.row.stock > 0;
  const deleteTitle = hasStock ? t('inventario.deleteBlockedTitle') : t('inventario.deleteConfirmTitle');
  const deleteBody = hasStock ? t('inventario.deleteBlockedBody') : t('inventario.deleteConfirmBody');

  return (
    <>
      <ProductoDetailScreen
        producto={props.row.producto}
        stock={props.row.stock}
        conversionEnabled={conversionEnabled}
        onSave={handleSave}
        saving={editar.isPending}
        onEntrada={() => setMovTipo('entrada')}
        onSalida={() => setMovTipo('salida')}
        onDelete={() => setConfirmDeleteOpen(true)}
        deleting={eliminar.isPending}
        onSelectIcon={props.onSelectIcon}
        onBack={props.onBack}
        iconOverride={iconOverride}
        testID={props.testID}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title={deleteTitle}
        description={deleteBody}
        confirmLabel={t('actions.delete')}
        tone="danger"
      />

      {businessId && movTipo && (
        <MovimientoModal
          open
          onClose={() => setMovTipo(null)}
          onSubmit={handleMovSubmit}
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
