/**
 * Left-slot variants for AppShell's TopBar.
 *
 * Two presentations share the same physical slot:
 *
 * - `RoleAvatar` — the §8.4 InitialsAvatar that opens the role picker
 *   (default for the bottom-tab roots: Inicio, Ventas, Egresos, …).
 * - `BackButton` — a ghost icon-only Btn rendered when AppShell is
 *   given an `onBack` callback (UI-AUDIT-1, Issue 2). Used on routes
 *   reached from a parent screen — Settings, Cuentas por Cobrar — so
 *   the user has a clear way to return.
 *
 * Extracted out of `app-shell.tsx` purely to keep that file under the
 * §4.4 200-line file budget. No behaviour changes vs the inlined
 * versions.
 */

import type { ReactElement } from 'react';
import { Btn, Icon, InitialsAvatar } from '../../components/index';
import { colors } from '../../theme';
import type { Role } from '../../app-config/index';

interface RoleAvatarProps {
  readonly role: Role;
  readonly value: string;
  readonly onChange: () => void;
  readonly ariaLabel: string;
}

export function RoleAvatar(props: RoleAvatarProps): ReactElement {
  return (
    <InitialsAvatar
      testID="top-bar-role-chip"
      value={props.value}
      variant={props.role === 'director' ? 'dark' : 'brand'}
      onPress={props.onChange}
      ariaLabel={props.ariaLabel}
      size="md"
    />
  );
}

interface BackButtonProps {
  readonly onPress: () => void;
  readonly ariaLabel: string;
}

/**
 * Audit M-1 follow-up (UI-AUDIT-1, Issue 2): icon-only ghost Btn
 * rendered in the TopBar's left slot when AppShell is given an
 * `onBack` callback. Replaces the role avatar on routes reached from
 * a parent screen so the user has a clear way to return.
 */
export function BackButton(props: BackButtonProps): ReactElement {
  return (
    <Btn
      variant="ghost"
      size="sm"
      onPress={props.onPress}
      testID="top-bar-back"
      ariaLabel={props.ariaLabel}
      icon={<Icon name="chevron-left" size={20} color={colors.black} />}
    />
  );
}
