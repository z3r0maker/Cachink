/**
 * «Pendientes de registrar» (Track M, M-09; the Turno board's amber-headed
 * panel): the recurring gastos that are due and nobody has captured, each
 * with its due chip and its amount, and «Registrar» opening Gastos' sheet.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { ICONS } from '@xangarro/caja';
import { chipVence } from '@xangarro/caja/gastos';
import type { PendienteRecurrente } from '@xangarro/caja/turno';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { QuietPanel } from '../../components/Panel/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';

const TILE = {
  width: 44,
  height: 44,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  borderRadius: radii[2],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
  backgroundColor: colors.redSoft,
} as const;

/** The row's words: the gasto, its due chip, its detail. */
function Textos(p: { readonly x: PendienteRecurrente }): ReactElement {
  return (
    <View flex={1} minWidth={0} gap={4} alignItems="flex-start">
      <View flexDirection="row" alignItems="center" gap={8} flexWrap="wrap">
        <MText size="body" weight="extraBold" textAlign="left">
          {p.x.nombre}
        </MText>
        <View
          borderRadius={radii[1]}
          borderWidth={borderWidths.thin}
          borderColor={colors.black}
          backgroundColor={colors.redSoft}
          paddingHorizontal={10}
          paddingVertical={2}
        >
          <MText size="xs" weight="bold" color={colors.redText}>
            {chipVence(p.x.vence)}
          </MText>
        </View>
      </View>
      <MText size="xs" weight="semibold" color={colors.gray600} textAlign="left" numberOfLines={2}>
        {p.x.detalle}
      </MText>
    </View>
  );
}

function Fila(p: {
  readonly x: PendienteRecurrente;
  readonly onRegistrar: () => void;
}): ReactElement {
  return (
    <View
      testID={`turno-pendiente-${p.x.id}`}
      flexDirection="row"
      alignItems="center"
      gap={12}
      paddingHorizontal={16}
      paddingVertical={12}
      borderBottomWidth={borderWidths.quiet}
      borderBottomColor={borderColors.quiet}
    >
      <View style={TILE} aria-hidden>
        <PathIcon d={ICONS.gastos} size={20} strokeWidth={2.3} />
      </View>
      <Textos x={p.x} />
      <View alignItems="flex-end" gap={8}>
        <MText size="lg" weight="extraBold" fontVariant={['tabular-nums']}>
          {formatMoney(p.x.monto)}
        </MText>
        <Btn
          variant="secondary"
          size="sm"
          onPress={p.onRegistrar}
          testID={`turno-registrar-${p.x.id}`}
        >
          Registrar
        </Btn>
      </View>
    </View>
  );
}

/** The due recurring gastos; omitted entirely when there are none. */
export function MiTurnoPendientes(p: {
  readonly items: readonly PendienteRecurrente[];
  readonly onRegistrar: (x: PendienteRecurrente) => void;
}): ReactElement | null {
  if (p.items.length === 0) return null;
  return (
    <QuietPanel
      label="Pendientes de registrar"
      count={p.items.length}
      note="Gastos que se repiten y ya tocan"
      testID="turno-pendientes"
    >
      {p.items.map((x) => (
        <Fila key={x.id} x={x} onRegistrar={() => p.onRegistrar(x)} />
      ))}
    </QuietPanel>
  );
}
