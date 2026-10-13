/**
 * The strip above Inventario's lists (M-09): the three figures — how many
 * to restock (red), how many entradas and mermas this turno — then the two
 * joined tabs and the search. The words are the board's; the hints come
 * from the caja's derivations (`paraReponer`, `enLista`).
 */
import type { ReactElement } from 'react';
import { TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { enLista, resumen } from '@xangarro/caja/inventario';
import type { Existencia, Movimiento, Pestana } from '@xangarro/caja/inventario';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { SegmentedTabs } from '../../components/SegmentedTabs/index';
import { borderWidths, colors, portalFontSizes, radii, typography } from '../../theme';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';

const TILE = {
  borderWidth: borderWidths.quiet,
  borderRadius: radii[5],
  backgroundColor: colors.white,
  paddingHorizontal: 14,
  paddingVertical: 12,
  gap: 3,
  flex: 1,
} as const;

function Cifra(p: {
  readonly label: string;
  readonly value: string;
  readonly color: string;
  readonly hint: string;
}): ReactElement {
  return (
    <View style={TILE}>
      <MText
        size="xs"
        weight="extraBold"
        letterSpacing={1.2}
        color={colors.textMuted}
        style={{ textTransform: 'uppercase' }}
      >
        {p.label}
      </MText>
      <MText
        size="xl3"
        weight="extraBold"
        letterSpacing={-0.7}
        color={p.color}
        fontVariant={['tabular-nums']}
      >
        {p.value}
      </MText>
      <MText size="xs" weight="semibold" color={colors.gray600}>
        {p.hint}
      </MText>
    </View>
  );
}

const NADA = 'Nada todavía';

/** The three KPI cards; the entrada/merma hints name what moved, or nothing. */
export function Kpis(p: {
  readonly items: readonly Existencia[];
  readonly movs: readonly Movimiento[];
}): ReactElement {
  const r = resumen(p.items, p.movs);
  const entradas = enLista(p.movs, p.items, 'Entrada');
  const mermas = enLista(p.movs, p.items, 'Merma');
  return (
    <View testID="inventario-kpis" flexDirection="row" gap={10}>
      <Cifra
        label="Por reponer"
        value={String(r.porReponer)}
        color={colors.redText}
        hint="Están en o abajo de su umbral"
      />
      <Cifra
        label="Entradas de hoy"
        value={String(r.entradas)}
        color={colors.greenText}
        hint={entradas === '' ? NADA : entradas}
      />
      <Cifra
        label="Mermas de hoy"
        value={String(r.mermas)}
        color={colors.black}
        hint={mermas === '' ? NADA : mermas}
      />
    </View>
  );
}

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
        { key: 'movimientos', label: 'Movimientos de mi turno', count: p.movs },
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
          fontFamily: typography.fontFamily,
          fontWeight: '600',
          fontSize: portalFontSizes.body,
          color: colors.black,
        }}
      />
    </View>
  );
}

/** What the screen says it is (the board's h1 row, said the phone's way). */
export function Cabeza(): ReactElement {
  return (
    <View gap={2}>
      <MText size="xl4" weight="extraBold" letterSpacing={-0.9} role="heading">
        Inventario
      </MText>
      <MText size="md" weight="semibold" color={colors.gray600}>
        Lo que hay y lo que se movió en tu turno
      </MText>
    </View>
  );
}

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
