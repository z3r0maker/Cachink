/**
 * Expo Router entry for /cuentas-por-cobrar (P1C-M6, S4-C1 route
 * wire-up). Renders the full CxC screen (KPI + sort toggle + strip).
 *
 * UI-AUDIT-1 Issue 2 — `activeTabKey` was `'ajustes'`, lighting up the
 * wrong bottom tab; the screen is reached from Director Home so
 * `'home'` is the truthful key. The route also exposes a back button
 * so the user can return without hunting through the bottom-tab bar.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { CuentasPorCobrarScreen, useCuentasPorCobrar, useTranslation } from '@cachink/ui';
import type { IsoDate } from '@cachink/domain';
import { AppShellWrapper } from '../shell/app-shell-wrapper';

function todayIso(): IsoDate {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}` as IsoDate;
}

export default function CuentasPorCobrarRoute(): ReactElement {
  const cxcQ = useCuentasPorCobrar();
  const router = useRouter();
  const { t } = useTranslation();

  const handleBack = (): void => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/' as never);
  };

  return (
    <AppShellWrapper
      activeTabKey="home"
      title={t('cuentasPorCobrar.title')}
      onBack={handleBack}
    >
      <CuentasPorCobrarScreen rows={cxcQ.data ?? []} today={todayIso()} />
    </AppShellWrapper>
  );
}
