/**
 * Mi turno's four figures (Track M, M-09; the Turno board's KPI tiles):
 * Ventas, Cobrado, Fiado y Gastos, each with its hint, two by two on the
 * phone. The copy and colours come from `kpisMiTurno` in `@xangarro/caja`.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { kpisMiTurno, type TurnoData } from '@xangarro/caja/turno';
import { MText } from '../../components/Mostrador/index';
import { Eyebrow } from '../../components/Panel/index';
import { borderWidths, colors, radii, shadows } from '../../theme';

function Tile(p: {
  readonly k: string;
  readonly v: string;
  readonly hint: string;
  readonly color: string;
}): ReactElement {
  return (
    <View
      flex={1}
      padding={12}
      gap={4}
      borderRadius={radii[4]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
      style={{ boxShadow: shadows.card }}
    >
      <Eyebrow>{p.k}</Eyebrow>
      <MText
        size="xl2"
        weight="extraBold"
        numberOfLines={1}
        fontVariant={['tabular-nums']}
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

/** The board's four tiles, two rows of two on the phone. */
export function MiTurnoCifras(p: { readonly data: TurnoData }): ReactElement {
  const items = kpisMiTurno(p.data);
  return (
    <View flexDirection="row" flexWrap="wrap" gap={10} testID="turno-cifras">
      {items.map((t) => (
        <View key={t.label} width="48%" flexGrow={1}>
          <Tile k={t.label} v={t.value} hint={t.hint} color={t.color} />
        </View>
      ))}
    </View>
  );
}
