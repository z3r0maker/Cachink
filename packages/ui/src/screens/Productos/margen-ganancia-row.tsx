/**
 * MargenGananciaRow — read-only display row showing the gross margin
 * (profit + percentage) for a product. Appears below "Precio de venta"
 * in both the create and edit product forms.
 *
 * Shows "—" when inputs are incomplete and highlights the value in red
 * when the margin is negative.
 */

import { useMemo, type ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { fromPesos, formatMoney, calcularMargenProducto, type Money } from '@cachink/domain';
import { colors, typography } from '../../theme';
import type { useTranslation } from '../../i18n/index';

type T = ReturnType<typeof useTranslation>['t'];

/** Try to parse a peso string ("12.50") into Money; returns null on failure. */
function safeParsePesos(pesos: string): Money | null {
  const trimmed = pesos.trim();
  if (!trimmed || !/^-?\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  try {
    return fromPesos(trimmed);
  } catch {
    return null;
  }
}

export function MargenGananciaRow(props: {
  costoPesos: string;
  precioVentaPesos: string;
  t: T;
}): ReactElement {
  const margen = useMemo(() => {
    const costo = safeParsePesos(props.costoPesos);
    const precio = safeParsePesos(props.precioVentaPesos);
    if (costo === null || precio === null) return null;
    return calcularMargenProducto(costo, precio);
  }, [props.costoPesos, props.precioVentaPesos]);

  const display = margen
    ? `${formatMoney(margen.gananciaCentavos)} (${margen.margenPct}%)`
    : '—';
  const isNegative = margen !== null && margen.margenPct < 0;

  return (
    <View
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      paddingHorizontal={4}
      paddingVertical={6}
      testID="margen-ganancia-row"
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={13}
        color={colors.gray600}
      >
        {props.t('nuevoProducto.margenLabel')}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={13}
        color={isNegative ? colors.red : colors.ink}
        testID="margen-ganancia-value"
      >
        {display}
      </Text>
    </View>
  );
}
