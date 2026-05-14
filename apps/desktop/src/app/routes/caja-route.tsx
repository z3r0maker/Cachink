/**
 * Desktop route adapter for /caja — cash drawer management.
 *
 * Thin wrapper around `CajaContent` (packages/ui) which handles
 * the open/closed turn logic, AbrirCajaModal, and CerrarCajaModal.
 *
 * Refactored per CLAUDE.md §6 (40-line budget).
 */

import type { ReactElement } from 'react';
import { CajaContent } from '@cachink/ui';
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';

export function CajaRoute(): ReactElement {
  return (
    <DesktopAppShellWrapper activeTabKey="otros">
      <CajaContent testID="desktop-caja" />
    </DesktopAppShellWrapper>
  );
}
