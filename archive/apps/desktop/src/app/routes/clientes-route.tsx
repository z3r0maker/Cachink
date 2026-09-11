/**
 * Desktop route adapter for /clientes. Mirrors
 * `apps/mobile/src/app/clientes.tsx`.
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
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';

export function ClientesRoute(): ReactElement {
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Client | null>(null);
  const clientsQ = useClientsForBusiness();
  const cxcQ = useCuentasPorCobrar();
  const crear = useCrearCliente();

  const saldos = new Map<string, bigint>();
  for (const row of cxcQ.data ?? []) {
    saldos.set(row.cliente.id, row.total as bigint);
  }
  const items: readonly ClienteWithSaldo[] = (clientsQ.data ?? []).map((c: Client) => ({
    cliente: c,
    saldoPendiente: (saldos.get(c.id) ?? 0n) as never,
  }));

  return (
    <DesktopAppShellWrapper activeTabKey="clientes">
      <ClientesScreen
        query={query}
        onChangeQuery={setQuery}
        items={items}
        onNuevoCliente={() => setModalOpen(true)}
        onClientePress={(item) => setSelected(item.cliente)}
      />
      <NuevoClienteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(input) => crear.mutate(input, { onSuccess: () => setModalOpen(false) })}
        submitting={crear.isPending}
      />
      <ClienteDetailRoute cliente={selected} onClose={() => setSelected(null)} />
    </DesktopAppShellWrapper>
  );
}
