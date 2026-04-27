/**
 * Desktop route adapter for /cuentas-por-cobrar. Mirrors
 * `apps/mobile/src/app/cuentas-por-cobrar.tsx`.
 */

import type { ReactElement } from 'react';
import { CuentasPorCobrarScreen, useCuentasPorCobrar } from '@cachink/ui';
import type { IsoDate } from '@cachink/domain';
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';

function todayIso(): IsoDate {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}` as IsoDate;
}

export function CuentasPorCobrarRoute(): ReactElement {
  const cxcQ = useCuentasPorCobrar();
  return (
    <DesktopAppShellWrapper activeTabKey="ajustes">
      <CuentasPorCobrarScreen rows={cxcQ.data ?? []} today={todayIso()} />
    </DesktopAppShellWrapper>
  );
}
