/**
 * RoleIllustration — renders the correct DALL·E person silhouette for a
 * given role inside a transparent Tamagui `<View>` frame.
 *
 * Two colour variants per role:
 *   - `dark`  — black silhouette (for yellow / light backgrounds)
 *   - `light` — yellow silhouette (for dark backgrounds)
 *
 * The images are static ESM imports resolved by Metro (mobile) or Vite
 * (desktop) at build time. No runtime network requests.
 */

import type { ReactElement } from 'react';
import { Image } from 'react-native';
import { View } from '@tamagui/core';
import type { Role } from '../../app-config/index';

import directorDark from '../../assets/role-director-dark.png';
import directorLight from '../../assets/role-director-light.png';
import operativoDark from '../../assets/role-operativo-dark.png';
import operativoLight from '../../assets/role-operativo-light.png';

/** Image source values — numeric asset IDs (Metro) or URL strings (Vite). */
const ILLUSTRATIONS: Record<Role, Record<IllustrationVariant, number | string>> = {
  director: { dark: directorDark, light: directorLight },
  operativo: { dark: operativoDark, light: operativoLight },
};

export type IllustrationVariant = 'dark' | 'light';

export interface RoleIllustrationProps {
  readonly role: Role;
  /**
   * Colour variant of the silhouette.
   *   - `dark`  = black silhouette (use on yellow / light backgrounds)
   *   - `light` = yellow silhouette (use on dark backgrounds)
   * Defaults to `dark`.
   */
  readonly variant?: IllustrationVariant;
  /** Render size in px (square). Defaults to 28 (fits inside the md avatar's 44px box). */
  readonly size?: number;
  readonly testID?: string;
}

export function RoleIllustration(props: RoleIllustrationProps): ReactElement {
  const size = props.size ?? 28;
  const variant = props.variant ?? 'dark';
  const raw = ILLUSTRATIONS[props.role][variant];
  const source = typeof raw === 'string' ? { uri: raw } : raw;

  return (
    <View testID={props.testID ?? 'role-illustration'}>
      <Image
        source={source}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}
