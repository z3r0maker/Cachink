/**
 * «Movimientos de tu turno» (Track M, M-09): the turno's standing ventas,
 * gastos, abonos y mermas, each with its glyph and tint, the hora and the
 * signed amount («Sin monto» for the ones that move no money). «Ver ventas»
 * opens the Ventas tab.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney, type Money } from '@xangarro/domain';
import type { Movimiento, MovimientoTipo } from '@xangarro/caja/turno';
import { MText } from '../../components/Mostrador/index';
import { QuietPanel } from '../../components/Panel/index';
import { PathIcon } from '../../components/PathIcon/index';
import { Btn } from '../../components/Btn/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';

const KIND: Record<MovimientoTipo, { readonly tint: string; readonly icon: string }> = {
  venta: {
    tint: colors.greenSoft,
    icon: 'M3 6h2l2.4 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L21 9H6',
  },
  gasto: { tint: colors.redSoft, icon: 'M12 3v14M6 11l6 6 6-6M4 21h16' },
  credito: {
    tint: colors.warningSoft,
    icon: 'M16 20v-2a4 4 0 0 0-8 0v2M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  },
  abono: { tint: colors.blueSoft, icon: 'M12 19V5M5 12l7-7 7 7' },
  merma: { tint: colors.peachSoft, icon: 'M12 5v14M5 12l7 7 7-7' },
};

/** «Sin monto» for movements that move no money; negatives in red with a true minus. */
function amount(m: Money): { readonly text: string; readonly color: string } {
  if (m === 0n) return { text: 'Sin monto', color: colors.textMuted };
  if (m < 0n) return { text: `−${formatMoney(-m)}`, color: colors.redText };
  return { text: formatMoney(m), color: colors.black };
}

/** The row's texts: what it was, and the signed amount beside the hora. */
function Textos(p: {
  readonly m: Movimiento;
  readonly a: { readonly text: string; readonly color: string };
}): ReactElement {
  return (
    <>
      <View flex={1} minWidth={0} gap={2} alignItems="flex-start">
        <MText size="body" weight="extraBold" textAlign="left" numberOfLines={1}>
          {p.m.titulo}
        </MText>
        <MText
          size="xs"
          weight="semibold"
          color={colors.gray600}
          textAlign="left"
          numberOfLines={2}
        >
          {p.m.detalle}
        </MText>
      </View>
      <MText size="xs" weight="bold" color={colors.gray600} fontVariant={['tabular-nums']}>
        {p.m.hora}
      </MText>
      <MText
        size="lg"
        weight="extraBold"
        fontVariant={['tabular-nums']}
        color={p.a.color}
        minWidth={86}
        textAlign="right"
      >
        {p.a.text}
      </MText>
    </>
  );
}

function Fila(p: { readonly m: Movimiento }): ReactElement {
  const k = KIND[p.m.tipo];
  const a = amount(p.m.monto);
  return (
    <View
      testID={`turno-movimiento-${p.m.id}`}
      flexDirection="row"
      alignItems="center"
      gap={12}
      paddingHorizontal={16}
      paddingVertical={12}
      borderBottomWidth={borderWidths.quiet}
      borderBottomColor={borderColors.quiet}
    >
      <View
        width={40}
        height={40}
        alignItems="center"
        justifyContent="center"
        borderRadius={radii[2]}
        borderWidth={borderWidths.thin}
        borderColor={colors.black}
        backgroundColor={k.tint}
        aria-hidden
      >
        <PathIcon d={k.icon} size={19} strokeWidth={2.4} />
      </View>
      <Textos m={p.m} a={a} />
    </View>
  );
}

/** The turno's movements in one quiet panel; «Ver ventas» opens the Ventas tab. */
export function MiTurnoMovimientos(p: {
  readonly items: readonly Movimiento[];
  readonly onVerVentas: () => void;
}): ReactElement {
  return (
    <QuietPanel
      label="Movimientos de tu turno"
      count={p.items.length}
      testID="turno-movimientos"
      action={
        <Btn variant="quiet" size="sm" onPress={p.onVerVentas} testID="turno-ver-ventas">
          Ver ventas
        </Btn>
      }
    >
      {p.items.map((m) => (
        <Fila key={m.id} m={m} />
      ))}
    </QuietPanel>
  );
}
