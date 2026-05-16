/**
 * Left-slot variants for AppShell's TopBar.
 *
 * Two presentations share the same physical slot:
 *
 * - `RoleAvatar` — a branded square containing the DALL·E person
 *   silhouette (suit+tie for Director, polo+apron for Operativo).
 *   Tapping fires `onChangeRole` to open the role picker.
 * - `BackButton` — a ghost icon-only Btn rendered when AppShell is
 *   given an `onBack` callback (UI-AUDIT-1, Issue 2). Used on routes
 *   reached from a parent screen — Settings, Cuentas por Cobrar — so
 *   the user has a clear way to return.
 *
 * Extracted out of `app-shell.tsx` purely to keep that file under the
 * §4.4 200-line file budget.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { Btn, Icon, RoleIllustration } from '../../components/index';
import { colors, radii, shadows } from '../../theme';
import type { Role } from '../../app-config/index';

interface RoleAvatarProps {
  readonly role: Role;
  readonly onChange: () => void;
  readonly ariaLabel: string;
}

const PRESSED_STYLE = {
  transform: [{ translateX: 2 }, { translateY: 2 }] as const,
  style: { boxShadow: shadows.pressed },
};

/**
 * Branded avatar square with the role silhouette illustration.
 *
 * Director → black background + yellow (light) silhouette.
 * Operativo → yellow background + black (dark) silhouette.
 *
 * The frame dimensions (48×48 px) with a 36×36 illustration fill 75%
 * of the frame, making the silhouette details (tie, collar, apron)
 * clearly visible on a phone.
 */
export function RoleAvatar(props: RoleAvatarProps): ReactElement {
  const isDirector = props.role === 'director';
  const bg = isDirector ? colors.black : colors.yellow;
  const illustrationVariant = isDirector ? 'light' : 'dark';

  return (
    <View
      testID="top-bar-role-chip"
      onPress={props.onChange}
      pressStyle={PRESSED_STYLE}
      backgroundColor={bg}
      borderColor={colors.black}
      borderWidth={2}
      borderRadius={radii[1]}
      width={48}
      height={48}
      alignItems="center"
      justifyContent="center"
      cursor="pointer"
      role="button"
      aria-label={props.ariaLabel}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={{ boxShadow: shadows.small, userSelect: 'none' }}
    >
      <RoleIllustration role={props.role} variant={illustrationVariant} size={36} />
    </View>
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
