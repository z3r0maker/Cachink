/**
 * Expo Router entry for /cobranza, «Fiado y abonos» (MvCobranza; Track M,
 * M-08): who owes the business, opened from Mi turno, Inicio and the rail.
 * A stack route with the way back to Mi turno; a client opens their account.
 */
import { useCallback, type ReactElement } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { CobranzaScreen, useCuentas } from '@xangarro/ui';
import { AppShellWrapper, useBackTo } from '../../shell/app-shell-wrapper';

export default function CobranzaRoute(): ReactElement {
  const router = useRouter();
  const back = useBackTo('/turno');
  const cuentas = useCuentas();
  const { refetch } = cuentas;
  useFocusEffect(useCallback(() => refetch(), [refetch]));
  return (
    <AppShellWrapper title="Mi turno" backLabel="Volver a Mi turno" onBack={back}>
      <CobranzaScreen
        state={cuentas.state}
        cuentas={cuentas.cuentas}
        hoy={cuentas.hoy}
        onAbrir={(id) => router.push(`/cobranza/${encodeURIComponent(id)}` as never)}
        onRetry={refetch}
      />
    </AppShellWrapper>
  );
}
