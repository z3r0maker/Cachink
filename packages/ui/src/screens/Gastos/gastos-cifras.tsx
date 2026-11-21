/**
 * The strip above the Gastos list (M-08, RvGastos): two quiet figures side by
 * side — what left the drawer (red) and how many — the one line about
 * receipts the owner will ask for, and the category chips. No search: the
 * chips are the filter.
 */
import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { CATEGORIAS, resumen, type CategoriaGasto, type GastosData } from '@xangarro/caja/gastos';
import { Chip } from '../../components/Chip/index';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';

const TILE = {
  flex: 1,
  minWidth: 0,
  borderWidth: borderWidths.quiet,
  borderColor: borderColors.quiet,
  borderRadius: radii[3],
  backgroundColor: colors.white,
  paddingHorizontal: 12,
  paddingVertical: 10,
  gap: 2,
} as const;

function Cifra(p: {
  readonly label: string;
  readonly value: string;
  readonly color?: string;
  readonly testID?: string;
}): ReactElement {
  return (
    <View style={TILE}>
      <MText size="xs" weight="bold" color={colors.gray600}>
        {p.label}
      </MText>
      <MText
        size="lg"
        weight="extraBold"
        color={p.color}
        fontVariant={['tabular-nums']}
        testID={p.testID}
      >
        {p.value}
      </MText>
    </View>
  );
}

/** «1 sin comprobante. Los patrones te lo van a preguntar.», only when one lacks it. */
function NotaComprobante(p: { readonly n: number }): ReactElement | null {
  if (p.n === 0) return null;
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={10}
      padding={12}
      borderRadius={radii[3]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.yellowSoft}
    >
      <PathIcon d={COBRAR_GLYPHS.info} size={18} />
      <MText
        size="sm"
        weight="semibold"
        color={colors.ink}
        flex={1}
        testID="gastos-sin-comprobante"
      >
        {`${p.n} sin comprobante. Los patrones te lo van a preguntar.`}
      </MText>
    </View>
  );
}

export function Cifras({ data }: { readonly data: GastosData }): ReactElement {
  const r = resumen(data.gastos);
  return (
    <View testID="gastos-cifras" gap={10}>
      <View flexDirection="row" gap={8}>
        <Cifra label="Salió de caja chica" value={formatMoney(r.total)} color={colors.redText} />
        <Cifra label="Gastos" value={String(r.cuantos)} testID="gastos-cuantos" />
      </View>
      <NotaComprobante n={r.sinComprobante} />
    </View>
  );
}

const FILTROS = ['Todos', ...CATEGORIAS] as const;

export function Filtros(p: {
  readonly valor: 'Todos' | CategoriaGasto;
  readonly onElegir: (f: 'Todos' | CategoriaGasto) => void;
}): ReactElement {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
      testID="gastos-filtros"
    >
      {FILTROS.map((f) => (
        <Chip
          key={f}
          label={f}
          selected={p.valor === f}
          onPress={() => p.onElegir(f)}
          testID={`gastos-filtro-${f}`}
        />
      ))}
    </ScrollView>
  );
}
