/**
 * Mi turno's two figures (MvTurno «Resumen del turno»): Ventas with its
 * cancellations and Cobrado across every method, side by side on quiet
 * tiles (read, not pressed). The copy and colours come from `kpisMiTurno`
 * in `@xangarro/caja`.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { kpisMiTurno, type TurnoData } from '@xangarro/caja/turno';
import { MText } from '../../components/Mostrador/index';
import { Eyebrow } from '../../components/Panel/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';

function Tile(p: {
  readonly k: string;
  readonly v: string;
  readonly hint: string;
  readonly color: string;
}): ReactElement {
  return (
    <View
      flex={1}
      minWidth={0}
      paddingHorizontal={14}
      paddingVertical={12}
      gap={2}
      borderRadius={radii[5]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.white}
    >
      <Eyebrow>{p.k}</Eyebrow>
      <MText
        size="xl3"
        weight="extraBold"
        numberOfLines={1}
        adjustsFontSizeToFit
        fontVariant={['tabular-nums']}
        letterSpacing={-0.7}
        color={p.color}
      >
        {p.v}
      </MText>
      <MText size="xs" weight="semibold" color={colors.gray600} numberOfLines={2}>
        {p.hint}
      </MText>
    </View>
  );
}

export function MiTurnoCifras(p: { readonly data: TurnoData }): ReactElement {
  return (
    <View
      flexDirection="row"
      gap={10}
      testID="turno-cifras"
      role="region"
      aria-label="Resumen del turno"
    >
      {kpisMiTurno(p.data).map((t) => (
        <Tile key={t.label} k={t.label} v={t.value} hint={t.hint} color={t.color} />
      ))}
    </View>
  );
}
