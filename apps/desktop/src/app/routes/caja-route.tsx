/**
 * Desktop route adapter for /caja — cash drawer management.
 *
 * Thin wrapper around `CajaContent` (packages/ui) which handles
 * the open/closed turn logic, AbrirCajaModal, and CerrarCajaModal.
 *
 * Refactored per CLAUDE.md §6 (40-line budget).
 */

import type { ReactElement } from 'react';
import { CajaContent, operativoCajaToolItems, useFeatureFlags, useRole } from '@cachink/ui';
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';
import { useDesktopNavigate } from '../desktop-router-context';

export function CajaRoute(): ReactElement {
  const navigate = useDesktopNavigate();
  const role = useRole();
  const flags = useFeatureFlags();
  // Review item #7: mirrors apps/mobile/src/app/(tabs)/caja.tsx — the
  // Operativo tool grid lives here now that "Otros" left the bar.
  const toolItems = role === 'director' ? undefined : operativoCajaToolItems(flags);

  return (
    <DesktopAppShellWrapper activeTabKey="caja">
      <CajaContent testID="desktop-caja" toolItems={toolItems} onNavigateTool={navigate} />
    </DesktopAppShellWrapper>
  );
}
