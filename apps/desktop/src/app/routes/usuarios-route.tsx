/**
 * Desktop route adapter for /usuarios — Director-only user management.
 *
 * Thin wrapper around `UsuariosContent` (packages/ui). Desktop has
 * no native Alert — deletes are confirmed inline (no modal dialog).
 *
 * Refactored per CLAUDE.md §6 (40-line budget).
 */

import type { ReactElement } from 'react';
import { UsuariosContent } from '@cachink/ui';
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';

export function UsuariosRoute(): ReactElement {
  return (
    <DesktopAppShellWrapper activeTabKey="otros">
      <UsuariosContent
        onConfirmDelete={(_user, onConfirmed) => onConfirmed()}
        testID="usuarios-desktop-route"
      />
    </DesktopAppShellWrapper>
  );
}
