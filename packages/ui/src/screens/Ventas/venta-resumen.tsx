/**
 * The turno's three figures (MvVentas): the Ventas board's KPI tiles —
 * «Ventas del turno», «Cobrado», «En efectivo» — each with its hint. A
 * cancelled sale counts nowhere (`resumen`), so the figures and the list it
 * sits over never disagree.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { resumen, type VentaTurno } from '@xangarro/caja/ventas';
import { MText } from '../../components/Mostrador/index';
import { Eyebrow } from '../../components/Panel/index';
import { borderWidths, colors, radii, shadows } from '../../theme';

interface Cifra {
  readonly k: string;
  readonly v: string;
  readonly hint: string;
  readonly color?: string;
}

function Tile(t: Cifra): ReactElement {
  return (
    <View
      flex={1}
      padding={10}
      gap={3}
      borderRadius={radii[4]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
      style={{ boxShadow: shadows.card }}
    >
      <Eyebrow>{t.k}</Eyebrow>
      <MText size="xl2" weight="extraBold" numberOfLines={1} color={t.color}>
        {t.v}
      </MText>
      <MText size="xs" weight="semibold" color={colors.gray600} numberOfLines={2}>
        {t.hint}
      </MText>
    </View>
  );
}

/** The board's three tiles, side by side on the phone. */
export function VentaResumen(props: {
  readonly ventas: readonly VentaTurno[];
  readonly desde: string;
}): ReactElement {
  const r = resumen(props.ventas);
  const cifras: readonly Cifra[] = [
    { k: 'Ventas del turno', v: String(r.activas), hint: `Desde las ${props.desde}` },
    { k: 'Cobrado', v: formatMoney(r.cobrado), hint: 'Todos los métodos', color: colors.greenText },
    { k: 'En efectivo', v: formatMoney(r.efectivo), hint: 'Cuenta para tu corte' },
  ];
  return (
    <View flexDirection="row" gap={10} testID="venta-resumen">
      {cifras.map((c) => (
        <Tile key={c.k} {...c} />
      ))}
    </View>
  );
}
