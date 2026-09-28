/**
 * Inicio's four figures (MvInicio 2 × 2, TbInicio in one row): `kpisFor()`
 * from the caja package, the open turno's or, with none, the last one's.
 * The figure to act on («Efectivo esperado», «Fondo sugerido») is the soft
 * yellow tile with the black edge.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { StatItem } from '@xangarro/caja';
import { MText } from '../../components/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';

const marco = (fuerte: boolean) => ({
  flex: 1,
  minWidth: 0,
  gap: 3,
  paddingHorizontal: 14,
  paddingVertical: 12,
  borderRadius: radii[5],
  borderWidth: fuerte ? borderWidths.thin : borderWidths.quiet,
  borderColor: fuerte ? colors.black : borderColors.quiet,
  backgroundColor: fuerte ? colors.yellowSoft : colors.white,
});

function Kpi({ k }: { k: StatItem }): ReactElement {
  const fuerte = k.strong === true;
  return (
    <View testID="inicio-kpi" {...marco(fuerte)}>
      <MText
        size="xs"
        weight="extraBold"
        letterSpacing={1.2}
        color={fuerte ? colors.ink : colors.textMuted}
        style={{ textTransform: 'uppercase' }}
      >
        {k.label}
      </MText>
      <MText
        size="xl3"
        weight="extraBold"
        letterSpacing={-0.7}
        color={k.color}
        numberOfLines={1}
        adjustsFontSizeToFit
        fontVariant={['tabular-nums']}
      >
        {k.value}
      </MText>
      {k.hint ? (
        <MText size="xs" weight="semibold" color={fuerte ? colors.ink : colors.gray600}>
          {k.hint}
        </MText>
      ) : null}
    </View>
  );
}

export function InicioKpis(props: { items: readonly StatItem[]; enFila: boolean }): ReactElement {
  const filas = props.enFila ? [props.items] : [props.items.slice(0, 2), props.items.slice(2, 4)];
  return (
    <View gap={10} testID="inicio-kpis">
      {filas.map((fila, i) => (
        <View key={i} flexDirection="row" gap={10}>
          {fila.map((k) => (
            <Kpi key={k.label} k={k} />
          ))}
        </View>
      ))}
    </View>
  );
}
