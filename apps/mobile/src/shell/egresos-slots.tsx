/**
 * Egresos-route swipe slots — extracted from `app/egresos.tsx` so the
 * route function stays under the 40-line ceiling once Audit Round 2 K2
 * added swipe-to-edit + ConfirmDialog plumbing.
 */
import type { ReactElement } from 'react';
import { ConfirmDialog, EditarEgresoModal, useTranslation } from '@cachink/ui';
import type { useEliminarEgreso } from '@cachink/ui';
import type { Expense } from '@cachink/domain';

export interface EgresoSwipeSlotsProps {
  readonly editing: Expense | null;
  readonly setEditing: (e: Expense | null) => void;
  readonly confirmDelete: Expense | null;
  readonly setConfirmDelete: (e: Expense | null) => void;
  readonly eliminar: ReturnType<typeof useEliminarEgreso>;
}

export function EgresoSwipeSlots(props: EgresoSwipeSlotsProps): ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <EditarEgresoModal
        open={props.editing !== null}
        editing={props.editing}
        onClose={() => props.setEditing(null)}
      />
      <ConfirmDialog
        open={props.confirmDelete !== null}
        onClose={() => props.setConfirmDelete(null)}
        onConfirm={() => {
          if (props.confirmDelete) {
            props.eliminar.mutate({
              id: props.confirmDelete.id,
              fecha: props.confirmDelete.fecha,
            });
            props.setConfirmDelete(null);
          }
        }}
        title={t('egresos.delete')}
        confirmLabel={t('egresos.delete')}
        tone="danger"
      />
    </>
  );
}
