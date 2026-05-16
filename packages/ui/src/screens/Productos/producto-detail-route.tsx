/**
 * ProductoDetailRoute — smart wrapper for ProductoDetailPopover +
 * MovimientoModal + delete mutation (Slice 9.5 T04).
 *
 * Round 2 audit: both inventario routes passed `onProductoPress` as
 * `undefined`, orphaning ProductoDetailPopover, MovimientoModal,
 * useRegistrarMovimiento, and useEliminarProducto. This smart
 * wrapper closes the gap so stock rows are tappable and the full
 * entrada / salida / eliminar flow works end-to-end.
 *
 * Routes mount `<ProductoDetailRoute row={selected} onClose={...}
 * fecha={...} />` alongside `<StockScreen onProductoPress={setRow}
 * />` — same pattern as ClienteDetailRoute.
 */

import { useState, type ReactElement } from 'react';
import type { BusinessId, IsoDate, MovementType, NewInventoryMovement } from '@cachink/domain';
import { ConfirmDialog } from '../../components/index';
import { useCurrentBusinessId } from '../../app-config/index';
import { useRegistrarMovimiento } from '../../hooks/use-registrar-movimiento';
import { useEliminarProducto } from '../../hooks/use-eliminar-producto';
import { useTranslation } from '../../i18n/index';
import type { ProductoConStock } from '../../hooks/use-productos-con-stock';
import { ProductoDetailPopover } from './producto-detail-popover';
import { MovimientoModal } from './movimiento-modal';

export interface ProductoDetailRouteProps {
  readonly row: ProductoConStock | null;
  readonly fecha: IsoDate;
  readonly onClose: () => void;
  readonly testID?: string;
}

interface MovimientoState {
  readonly tipo: MovementType;
}

function useMovimientoModalState(): {
  state: MovimientoState | null;
  open: (tipo: MovementType) => void;
  close: () => void;
} {
  const [state, setState] = useState<MovimientoState | null>(null);
  return {
    state,
    open: (tipo) => setState({ tipo }),
    close: () => setState(null),
  };
}

function useDeleteHandler(
  row: ProductoConStock | null,
  onClose: () => void,
  onRequireConfirm: () => void,
): { onDelete: () => void; onConfirmDelete: () => void; deleting: boolean; hasStock: boolean } {
  const eliminar = useEliminarProducto();
  // Audit M-1 PR 4: always require confirmation before deleting —
  // never delete on first tap, regardless of stock level.
  const onDelete = (): void => {
    if (!row) return;
    onRequireConfirm();
  };
  const onConfirmDelete = (): void => {
    if (!row) return;
    eliminar.mutate(
      { id: row.producto.id, currentStock: row.stock, force: true },
      { onSuccess: () => onClose() },
    );
  };
  return {
    onDelete,
    onConfirmDelete,
    deleting: eliminar.isPending,
    hasStock: (row?.stock ?? 0) > 0,
  };
}

interface DetailModalsProps {
  readonly row: NonNullable<ProductoDetailRouteProps['row']>;
  readonly fecha: ProductoDetailRouteProps['fecha'];
  readonly businessId: BusinessId | null;
  readonly movimiento: ReturnType<typeof useMovimientoModalState>;
  readonly registrar: ReturnType<typeof useRegistrarMovimiento>;
  readonly del: ReturnType<typeof useDeleteHandler>;
  readonly deleteConfirmOpen: boolean;
  readonly onCloseDeleteConfirm: () => void;
  readonly deleteConfirmTitle: string;
  readonly deleteConfirmBody: string;
  readonly deleteConfirmLabel: string;
  readonly onClose: () => void;
  readonly handleSubmit: (input: NewInventoryMovement) => void;
}

function DetailModals(p: DetailModalsProps): ReactElement {
  return (
    <>
      <ProductoDetailPopover
        open={p.movimiento.state === null && !p.deleteConfirmOpen}
        producto={p.row.producto}
        stock={p.row.stock}
        onClose={p.onClose}
        onEntrada={() => p.movimiento.open('entrada')}
        onSalida={() => p.movimiento.open('salida')}
        onDelete={p.del.onDelete}
        deleting={p.del.deleting}
      />
      <ConfirmDialog
        open={p.deleteConfirmOpen}
        onClose={p.onCloseDeleteConfirm}
        onConfirm={p.del.onConfirmDelete}
        title={p.deleteConfirmTitle}
        description={p.deleteConfirmBody}
        confirmLabel={p.deleteConfirmLabel}
        tone="danger"
      />
      {p.businessId && p.movimiento.state && (
        <MovimientoModal
          open
          onClose={p.movimiento.close}
          onSubmit={p.handleSubmit}
          producto={p.row.producto}
          businessId={p.businessId}
          fecha={p.fecha}
          initialTipo={p.movimiento.state.tipo}
          submitting={p.registrar.isPending}
        />
      )}
    </>
  );
}

export function ProductoDetailRoute(props: ProductoDetailRouteProps): ReactElement | null {
  const { t } = useTranslation();
  const businessId = useCurrentBusinessId();
  const movimiento = useMovimientoModalState();
  const registrar = useRegistrarMovimiento();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const del = useDeleteHandler(props.row, props.onClose, () => setDeleteConfirmOpen(true));
  if (!props.row) return null;
  const handleSubmit = (input: NewInventoryMovement): void => {
    registrar.mutate(input, {
      onSuccess: () => {
        movimiento.close();
        props.onClose();
      },
    });
  };
  // Audit M-1 PR 4: stock-aware confirmation copy.
  const deleteTitle = del.hasStock
    ? t('inventario.deleteBlockedTitle')
    : t('inventario.deleteConfirmTitle');
  const deleteBody = del.hasStock
    ? t('inventario.deleteBlockedBody')
    : t('inventario.deleteConfirmBody');
  return (
    <DetailModals
      row={props.row}
      fecha={props.fecha}
      businessId={businessId as BusinessId | null}
      movimiento={movimiento}
      registrar={registrar}
      del={del}
      deleteConfirmOpen={deleteConfirmOpen}
      onCloseDeleteConfirm={() => setDeleteConfirmOpen(false)}
      deleteConfirmTitle={deleteTitle}
      deleteConfirmBody={deleteBody}
      deleteConfirmLabel={t('actions.delete')}
      onClose={props.onClose}
      handleSubmit={handleSubmit}
    />
  );
}
