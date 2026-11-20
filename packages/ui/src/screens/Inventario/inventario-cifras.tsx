/**
 * The strip above Inventario's lists (M-09, RvInventario): the three compact
 * figures — how many to restock (red), how many came in and spoiled this
 * turno — then the two joined tabs and the search. The words are the board's.
 */
import type { ReactElement } from 'react';
import { TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { resumen } from '@xangarro/caja/inventario';
import type { Existencia, Movimiento, Pestana } from '@xangarro/caja/inventario';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { SegmentedTabs } from '../../components/SegmentedTabs/index';
import {
  borderColors,
  borderWidths,
  colors,
  fontFace,
  portalFontSizes,
  radii,
  typography,
} from '../../theme';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';

const CELDA = {
  borderWidth: borderWidths.quiet,
  borderColor: borderColors.quiet,
  borderRadius: radii[3],
  backgroundColor: colors.white,
  paddingHorizontal: 12,
  paddingVertical: 10,
  gap: 2,
  flex: 1,
  minWidth: 0,
} as const;

/** One compact figure (RvInventario): its label, then the count. */
function Cifra(p: { readonly label: string; readonly value: number; readonly color: string }) {
  return (
    <View style={CELDA} aria-label={`${p.label}: ${p.value}`}>
      <MText size="xs" weight="bold" color={colors.gray600} numberOfLines={1}>
        {p.label}
      </MText>
      <MText size="sectionTitle" weight="extraBold" color={p.color} fontVariant={['tabular-nums']}>
        {String(p.value)}
      </MText>
    </View>
  );
}

/** The three compact figures (RvInventario): what to restock, what came in, what spoiled. */
export function Kpis(p: {
  readonly items: readonly Existencia[];
  readonly movs: readonly Movimiento[];
}): ReactElement {
  const r = resumen(p.items, p.movs);
  return (
    <View testID="inventario-kpis" flexDirection="row" gap={8}>
      <Cifra label="Reponer" value={r.porReponer} color={colors.redText} />
      <Cifra label="Llegó hoy" value={r.entradas} color={colors.black} />
      <Cifra label="Mermas" value={r.mermas} color={colors.black} />
    </View>
  );
}

/**
 * «Existencias» / «Movimientos», worded as the phone board (MvInventario) words
 * them; the long «Movimientos de mi turno» wraps on a phone and stays the
 * panel's title below.
 */
export function Pestanas(p: {
  readonly tab: Pestana;
  readonly items: number;
  readonly movs: number;
  readonly onElegir: (t: Pestana) => void;
}): ReactElement {
  return (
    <SegmentedTabs<Pestana>
      testID="inventario-tabs"
      ariaLabel="Qué ver"
      value={p.tab}
      onChange={p.onElegir}
      tabs={[
        { key: 'existencias', label: 'Existencias', count: p.items },
        { key: 'movimientos', label: 'Movimientos', count: p.movs },
      ]}
    />
  );
}

export function Buscador(p: {
  readonly q: string;
  readonly onQ: (q: string) => void;
}): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={10}
      height={48}
      paddingHorizontal={14}
      borderRadius={radii[3]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
    >
      <PathIcon d={COBRAR_GLYPHS.buscar} size={18} strokeWidth={2.4} color={colors.gray600} />
      <TextInput
        testID="inventario-buscar"
        aria-label="Buscar producto"
        placeholder="Buscar producto"
        placeholderTextColor={colors.textMuted}
        value={p.q}
        onChangeText={p.onQ}
        style={{
          flex: 1,
          height: 44,
          ...fontFace(typography.weights.semibold),
          fontSize: portalFontSizes.body,
          color: colors.black,
        }}
      />
    </View>
  );
}

/** What the screen says it is (the board's h1 row, said the phone's way). */
/** The list's regla: the yellow-soft note with the info circle. */
export function Regla(p: { readonly dueno: string }): ReactElement {
  return (
    <View
      testID="inventario-regla"
      flexDirection="row"
      gap={11}
      padding={14}
      borderRadius={radii[3]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.yellowSoft}
    >
      <PathIcon d={COBRAR_GLYPHS.info} size={20} strokeWidth={2.4} color={colors.black} />
      <MText flex={1} size="md" weight="semibold">
        {`Las ventas descuentan existencias solas. Tú registras entradas y mermas; el ajuste libre de existencias lo hace ${p.dueno} desde el portal.`}
      </MText>
    </View>
  );
}
