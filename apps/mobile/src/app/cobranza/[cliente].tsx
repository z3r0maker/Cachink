/**
 * Expo Router entry for /cobranza/[cliente], a client's account (MvCobranza's
 * client view, MvRecordarSaldo; Track M, M-08): the saldo, the open sales and
 * the abonos, «Recibir abono» through the use case and «Recordarle su saldo».
 * `?abonar=1` (Inicio's «Cobrar a …») opens with the abono sheet up.
 */
import type { ReactElement } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ClienteScreen, useClienteCobranza } from '@xangarro/ui';
import { AppShellWrapper, useBackTo } from '../../shell/app-shell-wrapper';

export default function ClienteCobranzaRoute(): ReactElement {
  const { cliente, abonar } = useLocalSearchParams<{ cliente: string; abonar?: string }>();
  const back = useBackTo('/cobranza');
  const c = useClienteCobranza(cliente ?? '');
  return (
    <AppShellWrapper title="Fiado y abonos" backLabel="Volver a Fiado y abonos" onBack={back}>
      <ClienteScreen
        state={c.state}
        cuenta={c.cuenta}
        hoy={c.hoy}
        negocio={c.negocio}
        abrirAbono={abonar === '1'}
        onRecibir={c.recibir}
        onRetry={c.refetch}
      />
    </AppShellWrapper>
  );
}
