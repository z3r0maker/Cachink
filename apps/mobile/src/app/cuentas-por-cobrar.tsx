/**
 * Expo Router entry for /cuentas-por-cobrar (P1C-M6, S4-C1 route
 * wire-up). Renders the full CxC screen (KPI + sort toggle + strip).
 */

import type { ReactElement } from 'react';
import { CuentasPorCobrarScreen, useCuentasPorCobrar } from '@cachink/ui';
import type { IsoDate } from '@cachink/domain';
import { AppShellWrapper } from '../shell/app-shell-wrapper';

function todayIso(): IsoDate {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}` as IsoDate;
}

export default function CuentasPorCobrarRoute(): ReactElement {
  const cxcQ = useCuentasPorCobrar();
  return (
    <AppShellWrapper activeTabKey="ajustes">
      <CuentasPorCobrarScreen rows={cxcQ.data ?? []} today={todayIso()} />
    </AppShellWrapper>
  );
}
