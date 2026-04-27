/**
 * Expo Router entry for /clientes (P1C-M6, S4-C1 route wire-up).
 *
 * Lists clientes with buscar + saldo pendiente badges. Tap opens
 * ClienteDetail. Nuevo Cliente opens the existing modal.
 *
 * Audit Round 2 K4 added swipe-to-edit + swipe-to-delete plumbing;
 * the slot wrappers live in `../shell/clientes-slots.tsx` so this
 * file stays under the §4.4 200-line cap.
 */

import { useState, type ReactElement } from 'react';
import {
  ClienteDetailRoute,
  ClientesScreen,
  type ClienteWithSaldo,
  NuevoClienteModal,
  useClientsForBusiness,
  useCuentasPorCobrar,
  useCrearCliente,
} from '@cachink/ui';
import type { Client } from '@cachink/domain';
import { AppShellWrapper } from '../shell/app-shell-wrapper';
import { useSwipeState } from '../shell/use-swipe-state';
import { ClienteSwipeSlots } from '../shell/clientes-slots';

function useClientesItems(): readonly ClienteWithSaldo[] {
  const clientsQ = useClientsForBusiness();
  const cxcQ = useCuentasPorCobrar();
  const saldos = new Map<string, bigint>();
  for (const row of cxcQ.data ?? []) {
    saldos.set(row.cliente.id, row.total as bigint);
  }
  return (clientsQ.data ?? []).map((c: Client) => ({
    cliente: c,
    saldoPendiente: (saldos.get(c.id) ?? 0n) as never,
  }));
}

export default function ClientesRoute(): ReactElement {
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Client | null>(null);
  const swipe = useSwipeState<Client>();
  const crear = useCrearCliente();
  const items = useClientesItems();

  return (
    <AppShellWrapper activeTabKey="clientes">
      <ClientesScreen
        query={query}
        onChangeQuery={setQuery}
        items={items}
        onNuevoCliente={() => setModalOpen(true)}
        onClientePress={(item) => setSelected(item.cliente)}
        onEditCliente={(item) => swipe.setEditing(item.cliente)}
        onEliminarCliente={(item) => swipe.setConfirmDelete(item.cliente)}
      />
      <NuevoClienteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(input) => crear.mutate(input, { onSuccess: () => setModalOpen(false) })}
        submitting={crear.isPending}
      />
      <ClienteDetailRoute cliente={selected} onClose={() => setSelected(null)} />
      <ClienteSwipeSlots
        editing={swipe.editing}
        setEditing={swipe.setEditing}
        confirmDelete={swipe.confirmDelete}
        setConfirmDelete={swipe.setConfirmDelete}
      />
    </AppShellWrapper>
  );
}
