/**
 * Cliente-route swipe slots — extracted from `app/clientes.tsx` so the
 * route function stays under the 40-line ceiling once Audit Round 2 K4
 * added swipe-to-edit + ConfirmDialog plumbing.
 */
import type { ReactElement } from 'react';
import {
  ConfirmDialog,
  NuevoClienteModal,
  useEditarCliente,
  useEliminarCliente,
  useTranslation,
} from '@cachink/ui';
import type { Client } from '@cachink/domain';

export interface ClienteSwipeSlotsProps {
  readonly editing: Client | null;
  readonly setEditing: (c: Client | null) => void;
  readonly confirmDelete: Client | null;
  readonly setConfirmDelete: (c: Client | null) => void;
}

export function ClienteSwipeSlots(props: ClienteSwipeSlotsProps): ReactElement {
  const { t } = useTranslation();
  const editar = useEditarCliente();
  const eliminar = useEliminarCliente();
  return (
    <>
      <NuevoClienteModal
        open={props.editing !== null}
        editing={props.editing ?? undefined}
        onClose={() => props.setEditing(null)}
        onSubmit={(input) => {
          if (props.editing) {
            editar.mutate(
              { id: props.editing.id, patch: input },
              { onSuccess: () => props.setEditing(null) },
            );
          }
        }}
        submitting={editar.isPending}
      />
      <ConfirmDialog
        open={props.confirmDelete !== null}
        onClose={() => props.setConfirmDelete(null)}
        onConfirm={() => {
          if (props.confirmDelete) {
            eliminar.mutate({ id: props.confirmDelete.id });
            props.setConfirmDelete(null);
          }
        }}
        title={t('clientes.title')}
        confirmLabel={t('actions.delete')}
        tone="danger"
      />
    </>
  );
}
