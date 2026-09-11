/**
 * Desktop route adapter for /empleados — Director-only employee management.
 *
 * Thin wrapper around `SettingsEmpleados` (packages/ui). Mirrors the
 * UsuariosRoute pattern.
 */

import type { ReactElement } from 'react';
import { SettingsEmpleados } from '@cachink/ui';
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';

export function EmpleadosRoute(): ReactElement {
  return (
    <DesktopAppShellWrapper activeTabKey="otros">
      <SettingsEmpleados />
    </DesktopAppShellWrapper>
  );
}
