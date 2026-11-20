/**
 * Expo Router entry for /cobranza/[cliente] (RvFiado «Cliente»): one
 * client's page on Fiado y abonos — the account, «Recibir abono» and
 * «Recordarle su saldo». Opened from a row of /fiado, or from Inicio's
 * «Cobrar a …» with `?abono=1`, which opens the abono sheet on arrival.
 */

import type { ReactElement } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ClienteScreen, useCobranza, useTranslation } from '@xangarro/ui';
import { AppShellWrapper, useBackTo } from '../../shell/app-shell-wrapper';

export default function ClienteRoute(): ReactElement {
  const { t } = useTranslation();
  const back = useBackTo('/fiado');
  const { cliente, abono } = useLocalSearchParams<{ cliente: string; abono?: string }>();
  const x = useCobranza();
  const cuenta = x.data?.cuentas.find((c) => c.id === cliente) ?? null;
  return (
    <AppShellWrapper title={cuenta?.nombre ?? t('shell.nav.fiado')} onBack={back}>
      <ClienteScreen
        testID="mobile-cliente"
        state={x.state}
        cuenta={cuenta}
        data={x.data}
        {...(abono === '1' ? { abrirAbono: true } : {})}
        onRegistrar={x.registrar}
        onRetry={x.refetch}
      />
    </AppShellWrapper>
  );
}
