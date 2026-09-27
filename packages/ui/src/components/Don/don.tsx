/**
 * Don Cuentas, full body (ADR-107), for the phone and the tablet.
 *
 * The native twin of `apps/web/src/components/don/don.tsx`: the same nine
 * poses under the same names, the same `pose` / `size` / `alt` props and the
 * same 160 px default. One pose per moment: `hola` greets, `quieto` listens,
 * `pensando` gives tips, `contando` is the loader, `celebrando` marks a win,
 * `preocupado` flags a problem, `senalando` points the way, `ayuda` is the help
 * centre, `caminando` walks the owner through a multi-step flow.
 *
 * Still, for now: the web's motion (breathing, the blink on `quieto`, the jump
 * on `celebrando`) isn't ported, so there is nothing for Reduce Motion to turn
 * off. Whoever adds it reads `useReducedMotion()` and keeps him still when it
 * is on.
 *
 * The poses are copies of the web's `poses/*.webp` in `../../assets/don/`,
 * resolved by Metro to asset IDs and by Vite to URLs, like `RoleIllustration`.
 */

import type { ReactElement } from 'react';
import { Image } from 'react-native';
import { View } from '@tamagui/core';

import ayuda from '../../assets/don/ayuda.webp';
import caminando from '../../assets/don/caminando.webp';
import celebrando from '../../assets/don/celebrando.webp';
import contando from '../../assets/don/contando.webp';
import hola from '../../assets/don/hola.webp';
import pensando from '../../assets/don/pensando.webp';
import preocupado from '../../assets/don/preocupado.webp';
import quieto from '../../assets/don/quieto.webp';
import senalando from '../../assets/don/senalando.webp';

export type DonPose =
  | 'hola'
  | 'quieto'
  | 'pensando'
  | 'contando'
  | 'celebrando'
  | 'preocupado'
  | 'senalando'
  | 'ayuda'
  | 'caminando';

/** Image source values — numeric asset IDs (Metro) or URL strings (Vite). */
const POSES: Readonly<Record<DonPose, number | string>> = {
  hola,
  quieto,
  pensando,
  contando,
  celebrando,
  preocupado,
  senalando,
  ayuda,
  caminando,
};

/** Every pose name, in the order the web documents them. */
export const DON_POSES = Object.keys(POSES) as readonly DonPose[];

export interface DonProps {
  readonly pose: DonPose;
  /** Square size in px. */
  readonly size?: number;
  /** Empty by default: his words always travel as text beside him. */
  readonly alt?: string;
  readonly testID?: string;
}

export function Don({ pose, size = 160, alt = '', testID }: DonProps): ReactElement {
  const raw = POSES[pose];
  const source = typeof raw === 'string' ? { uri: raw } : raw;
  const decorative = alt === '';
  return (
    <View testID={testID ?? `don-${pose}`} width={size} height={size}>
      <Image
        source={source}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        // Decorative by default, like the web's `alt=""`: screen readers skip
        // him unless the caller gives him words.
        accessible={!decorative}
        accessibilityRole={decorative ? 'none' : 'image'}
        accessibilityLabel={decorative ? undefined : alt}
        importantForAccessibility={decorative ? 'no' : 'yes'}
      />
    </View>
  );
}
