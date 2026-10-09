/**
 * The four figures the done screen repeats (Track M, M-09): Contado,
 * Esperado, Diferencia y Ventas, two by two with the difference tinted by
 * its kind.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';
import { conSigno, type EstadoConteo } from '@xangarro/caja/cierre';
import { MText } from '../../components/Mostrador/index';
import { Eyebrow } from '../../components/Panel/index';
import { borderWidths, radii } from '../../theme';

/** The difference's text colour for the stats grid and the lines. */
export const TINTA: Record<EstadoConteo['dif']['tipo'], string> = {
  cuadra: colors.greenText,
  falta: colors.redText,
  sobra: colors.blueText,
};

function Cifra(p: {
  readonly k: string;
  readonly v: string;
  readonly color?: string;
}): ReactElement {
  return (
    <View
      flex={1}
      padding={12}
      gap={3}
      borderRadius={radii[3]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
    >
      <Eyebrow>{p.k}</Eyebrow>
      <MText size="xl2" weight="extraBold" fontVariant={['tabular-nums']} color={p.color}>
        {p.v}
      </MText>
    </View>
  );
}

/** The four figures the corte repeats, two by two. */
export function Cifras(p: { readonly e: EstadoConteo; readonly ventas: number }): ReactElement {
  return (
    <View flexDirection="row" flexWrap="wrap" gap={10} testID="cierre-hecho-cifras">
      <Cifra k="Contado" v={formatMoney(p.e.contado)} />
      <Cifra k="Esperado" v={formatMoney(p.e.esperado)} />
      <View width="100%" flexDirection="row" gap={10}>
        <Cifra k="Diferencia" v={conSigno(p.e.dif)} color={TINTA[p.e.dif.tipo]} />
        <Cifra k="Ventas" v={String(p.ventas)} />
      </View>
    </View>
  );
}
