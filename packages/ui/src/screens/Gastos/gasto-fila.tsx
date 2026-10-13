/**
 * The Gastos rows (M-08): one expense of the turno — the category's tile and
 * chip, the comprobante chip, the time and the amount in red because it left
 * the drawer — and one due recurring gasto waiting to be paid. Both are what
 * the web's list and «Pendientes de registrar» say, said the same way.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { ICONS } from '@xangarro/caja';
import {
  CAT_ICON,
  CAT_TINT,
  CAT_TINTA,
  chipVence,
  type GastoTurno,
  type RecurrentePorPagar,
} from '@xangarro/caja/gastos';
import { detalleRecurrente } from '@xangarro/caja/turno';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderWidths, colors, radii, shapeRadii } from '../../theme';

/** The board's chip: a pill with the thin black edge, tint and text said by the caller. */
export function Etiqueta(p: {
  readonly label: string;
  readonly bg: string;
  readonly color: string;
  readonly testID?: string;
}): ReactElement {
  return (
    <View
      testID={p.testID}
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={p.bg}
      paddingHorizontal={11}
      paddingVertical={3}
      alignSelf="flex-start"
    >
      <MText size="xs" weight="bold" color={p.color}>
        {p.label}
      </MText>
    </View>
  );
}

const TILE = {
  width: 44,
  height: 44,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radii[2],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
} as const;

/** The category chip beside the comprobante one, under the row's main line. */
function Chips({ x }: { readonly x: GastoTurno }): ReactElement {
  const comp = x.comprobante;
  return (
    <View flexDirection="row" gap={8} flexWrap="wrap">
      <Etiqueta label={x.categoria} bg={CAT_TINT[x.categoria]} color={CAT_TINTA[x.categoria]} />
      <Etiqueta
        label={comp ? 'Con foto' : 'Sin comprobante'}
        bg={comp ? colors.greenSoft : colors.warningSoft}
        color={comp ? colors.greenText : colors.warningText}
        testID={`gasto-comp-${x.id}`}
      />
    </View>
  );
}

export function GastoFila({ x }: { readonly x: GastoTurno }): ReactElement {
  return (
    <View testID={`gasto-${x.id}`} gap={10} paddingHorizontal={16} paddingVertical={12}>
      <View flexDirection="row" alignItems="center" gap={12}>
        <View style={{ ...TILE, backgroundColor: CAT_TINT[x.categoria] }}>
          <PathIcon d={CAT_ICON[x.categoria]} size={20} strokeWidth={2.3} />
        </View>
        <View flex={1} minWidth={0} alignItems="flex-start">
          <MText size="body" weight="extraBold" textAlign="left">
            {x.concepto}
          </MText>
          <MText
            size="sm"
            weight="semibold"
            color={colors.gray600}
            textAlign="left"
            numberOfLines={1}
          >
            {x.detalle}
          </MText>
        </View>
        <View alignItems="flex-end" gap={2}>
          <MText size="lg" weight="extraBold" color={colors.redText} fontVariant={['tabular-nums']}>
            {`−${formatMoney(x.monto)}`}
          </MText>
          <MText size="sm" weight="semibold" color={colors.gray600} fontVariant={['tabular-nums']}>
            {x.hora}
          </MText>
        </View>
      </View>
      <Chips x={x} />
    </View>
  );
}

/** A due recurring gasto: its words and amount, its state chip, and «Registrar». */
export function PendienteFila(p: {
  readonly x: RecurrentePorPagar;
  readonly onPagar: () => void;
}): ReactElement {
  const r = p.x.para;
  return (
    <View
      testID={`gasto-recurrente-${r.id}`}
      flexDirection="row"
      alignItems="center"
      gap={12}
      paddingHorizontal={16}
      paddingVertical={12}
    >
      <View style={{ ...TILE, backgroundColor: colors.redSoft }}>
        <PathIcon d={ICONS.gastos} size={20} strokeWidth={2.3} />
      </View>
      <View flex={1} minWidth={0} gap={4} alignItems="flex-start">
        <View flexDirection="row" alignItems="center" gap={8} flexWrap="wrap">
          <MText size="body" weight="extraBold" textAlign="left">
            {r.concepto}
          </MText>
          {/* Due ones are vence ≤ 0 (`comoRecurrente` clamps), so the chip is always red here. */}
          <Etiqueta label={chipVence(r.vence)} bg={colors.redSoft} color={colors.redText} />
        </View>
        <MText size="sm" weight="semibold" color={colors.gray600} textAlign="left">
          {`${detalleRecurrente(r)} · ${formatMoney(BigInt(r.montoCentavos))}`}
        </MText>
      </View>
      <Btn variant="secondary" size="sm" onPress={p.onPagar} testID={`gastos-pagar-${r.id}`}>
        Registrar
      </Btn>
    </View>
  );
}
