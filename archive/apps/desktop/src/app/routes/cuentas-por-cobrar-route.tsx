/**
 * Desktop route adapter for /cuentas-por-cobrar. Mirrors
 * `apps/mobile/src/app/cuentas-por-cobrar.tsx`.
 *
 * UI-AUDIT-1 Issue 2 — `activeTabKey` was `'ajustes'`, lighting up the
 * wrong bottom tab; the screen is reached from Director Home so
 * `'home'` is the truthful key. The route also exposes a back button
 * so the user can return to Director Home directly.
 */

import type { ReactElement } from 'react';
import { CuentasPorCobrarScreen, useCuentasPorCobrar, useTranslation } from '@cachink/ui';
import type { IsoDate } from '@cachink/domain';
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';
import { useDesktopNavigate } from '../desktop-router-context';

function todayIso(): IsoDate {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}` as IsoDate;
}

export function CuentasPorCobrarRoute(): ReactElement {
  const cxcQ = useCuentasPorCobrar();
  const navigate = useDesktopNavigate();
  const { t } = useTranslation();

  const handleBack = (): void => navigate('/');

  return (
    <DesktopAppShellWrapper
      activeTabKey="home"
      title={t('cuentasPorCobrar.title')}
      onBack={handleBack}
    >
      <CuentasPorCobrarScreen rows={cxcQ.data ?? []} today={todayIso()} />
    </DesktopAppShellWrapper>
  );
}
