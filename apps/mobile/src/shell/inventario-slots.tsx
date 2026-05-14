/**
 * Inventario-route swipe slots — extracted from `app/inventario.tsx`
 * so the route function stays under the 40-line ceiling once Audit
 * Round 2 K3 added swipe-to-edit + ConfirmDialog plumbing.
 *
 * Phase 18: passes conversionEnabled to EditarProductoModal.
 */
import type { ReactElement } from 'react';
import {
  ConfirmDialog,
  EditarProductoModal,
  useEliminarProducto,
  useFeatureFlag,
  useTranslation,
  type ProductoConStock,
} from '@cachink/ui';

export interface ProductoSwipeSlotsProps {
  readonly editing: ProductoConStock | null;
  readonly setEditing: (r: ProductoConStock | null) => void;
  readonly confirmDelete: ProductoConStock | null;
  readonly setConfirmDelete: (r: ProductoConStock | null) => void;
}

export function ProductoSwipeSlots(props: ProductoSwipeSlotsProps): ReactElement {
  const { t } = useTranslation();
  const eliminar = useEliminarProducto();
  const conversionEnabled = useFeatureFlag('conversionMateriaPrima');
  return (
    <>
      <EditarProductoModal
        open={props.editing !== null}
        editing={props.editing?.producto ?? null}
        onClose={() => props.setEditing(null)}
        conversionEnabled={conversionEnabled}
      />
      <ConfirmDialog
        open={props.confirmDelete !== null}
        onClose={() => props.setConfirmDelete(null)}
        onConfirm={() => {
          if (props.confirmDelete) {
            eliminar.mutate({
              id: props.confirmDelete.producto.id,
              currentStock: props.confirmDelete.stock,
            });
            props.setConfirmDelete(null);
          }
        }}
        title={t('inventario.title')}
        confirmLabel={t('actions.delete')}
        tone="danger"
      />
    </>
  );
}
