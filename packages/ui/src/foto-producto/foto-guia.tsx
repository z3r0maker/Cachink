/**
 * The camera's guide: the live view inside yellow corners. A product is
 * framed square (MvFotoCamara); a ticket stands upright (CgHoja), so the
 * receipt's guide is portrait.
 */
import type { ReactElement, RefObject } from 'react';
import Svg, { Path } from 'react-native-svg';
import { View } from '@tamagui/core';
import { colors, radii } from '../theme';
import { FotoVisor } from './foto-visor';
import type { FotoVisorHandle } from './foto-visor-tipos';

export type FormaGuia = 'cuadrada' | 'vertical';

const MEDIDAS: Record<FormaGuia, { readonly w: number; readonly h: number }> = {
  cuadrada: { w: 300, h: 300 },
  vertical: { w: 250, h: 340 },
};

/** The four corners of a `w` × `h` guide, 40 px arms, 8 px radius. */
function esquinas(w: number, h: number): readonly string[] {
  const r = w - 4;
  const b = h - 4;
  return [
    'M4 44V12a8 8 0 0 1 8-8h32',
    `M${r - 40} 4h32a8 8 0 0 1 8 8v32`,
    `M${r} ${b - 40}v32a8 8 0 0 1-8 8h-32`,
    `M44 ${b}H12a8 8 0 0 1-8-8v-32`,
  ];
}

/** The yellow corners, over the view and over the permission button: never taking its touch. */
function Esquinas({ w, h }: { readonly w: number; readonly h: number }): ReactElement {
  return (
    <View testID="foto-guia-esquinas" position="absolute" pointerEvents="none">
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {esquinas(w, h).map((d) => (
          <Path
            key={d}
            d={d}
            fill="none"
            stroke={colors.yellow}
            strokeWidth={5}
            strokeLinecap="round"
          />
        ))}
      </Svg>
    </View>
  );
}

export function FotoGuia(p: {
  readonly visor: RefObject<FotoVisorHandle | null>;
  readonly linterna: boolean;
  readonly forma: FormaGuia;
  readonly permiso?: string;
}): ReactElement {
  const { w, h } = MEDIDAS[p.forma];
  return (
    <View width={w} height={h} alignItems="center" justifyContent="center">
      <View
        position="absolute"
        top={10}
        left={10}
        right={10}
        bottom={10}
        borderRadius={radii[2]}
        overflow="hidden"
      >
        <FotoVisor
          ref={p.visor}
          linterna={p.linterna}
          {...(p.permiso === undefined ? {} : { permiso: p.permiso })}
        />
      </View>
      <Esquinas w={w} h={h} />
    </View>
  );
}
