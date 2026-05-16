/**
 * Inventario-route swipe slots — extracted from `app/inventario.tsx`
 * so the route function stays under the 40-line ceiling once Audit
 * Round 2 K3 added swipe-to-edit + ConfirmDialog plumbing.
 *
 * EditarProductoModal retired — swipe-to-edit now navigates to the
 * inline-editable product detail page.
 */
import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import {
  ConfirmDialog,
  useEliminarProducto,
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
  const router = useRouter();

  // Navigate to detail page instead of opening modal
  if (props.editing) {
    router.push(`/productos/${props.editing.producto.id}` as never);
    props.setEditing(null);
  }

  return (
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
  );
}
