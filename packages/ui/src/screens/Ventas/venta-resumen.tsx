/**
 * The turno's figures (MvVentas «Resumen del turno»): one compact white card
 * split in three, «Cobrado», «En efectivo» in the cash green, and
 * «Canceladas». A cancelled sale counts only in the last (`cifrasVentas`), so
 * the figures and the list under them never disagree.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { cifrasVentas, type CifraVentas, type VentaTurno } from '@xangarro/caja/ventas';
import { MText } from '../../components/Mostrador/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';

/** The board's columns: the two amounts wider than the count. */
const ANCHO = [1.25, 1.25, 1] as const;

function Celda(p: { readonly c: CifraVentas; readonly i: number; readonly ultima: boolean }) {
  return (
    <View
      flex={ANCHO[p.i] ?? 1}
      minWidth={0}
      paddingHorizontal={12}
      gap={1}
      borderRightWidth={p.ultima ? 0 : borderWidths.quiet}
      borderRightColor={borderColors.quiet}
    >
      <MText size="xs" weight="bold" color={colors.gray600} numberOfLines={1}>
        {p.c.k}
      </MText>
      <MText
        size="sectionTitle"
        weight="extraBold"
        numberOfLines={1}
        adjustsFontSizeToFit
        color={p.c.tono === 'efectivo' ? colors.greenText : colors.black}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {p.c.v}
      </MText>
    </View>
  );
}

export function VentaResumen(props: { readonly ventas: readonly VentaTurno[] }): ReactElement {
  const cifras = cifrasVentas(props.ventas);
  return (
    <View
      flexDirection="row"
      paddingVertical={10}
      borderRadius={radii[5]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.white}
      role="group"
      aria-label="Resumen del turno"
      testID="venta-resumen"
    >
      {cifras.map((c, i) => (
        <Celda key={c.k} c={c} i={i} ultima={i === cifras.length - 1} />
      ))}
    </View>
  );
}
