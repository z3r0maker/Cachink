/**
 * The top of Inventario (MvInventario): the title, the three figures
 * (products to restock, entradas and mermas of the turno, `resumen`), the
 * Existencias / Movimientos tabs with their counts and, on Existencias, the
 * search.
 */
import type { ReactElement } from 'react';
import { TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { resumen, type Existencia, type Movimiento, type Pestana } from '@xangarro/caja/inventario';
import { MText, PathIcon, SegmentedTabs } from '../../components/index';
import {
  borderColors,
  borderWidths,
  colors,
  portalFontSizes,
  radii,
  typography,
} from '../../theme';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';

function Figura(p: { label: string; valor: number; rojo?: boolean; testID: string }): ReactElement {
  return (
    <View
      flex={1}
      minWidth={0}
      gap={1}
      paddingHorizontal={12}
      paddingVertical={8}
      borderRadius={radii[4]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.white}
      aria-label={`${p.label}: ${p.valor}`}
    >
      <MText size="xs" weight="extraBold" letterSpacing={0.7} color={colors.textMuted}>
        {p.label.toUpperCase()}
      </MText>
      <MText
        testID={p.testID}
        size="xl3"
        weight="extraBold"
        color={p.rojo && p.valor > 0 ? colors.redText : colors.black}
        fontVariant={['tabular-nums']}
      >
        {String(p.valor)}
      </MText>
    </View>
  );
}

function Buscador(p: { q: string; onQ: (q: string) => void }): ReactElement {
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
      <PathIcon d={COBRAR_GLYPHS.buscar} size={18} color={colors.gray600} />
      <TextInput
        testID="inventario-buscar"
        aria-label="Buscar producto del inventario"
        placeholder="Busca un producto"
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

export function InventarioCabeza(p: {
  readonly items: readonly Existencia[];
  readonly movs: readonly Movimiento[];
  readonly tab: Pestana;
  readonly onTab: (t: Pestana) => void;
  readonly q: string;
  readonly onQ: (q: string) => void;
}): ReactElement {
  const r = resumen(p.items, p.movs);
  return (
    <View paddingHorizontal={16} paddingTop={14} paddingBottom={8} gap={10}>
      <View flexDirection="row" alignItems="baseline" gap={10} flexWrap="wrap">
        <MText size="xl4" weight="extraBold" letterSpacing={-0.9} role="heading">
          Inventario
        </MText>
        <MText size="md" weight="semibold" color={colors.gray600}>
          Lo que hay y lo que se movió
        </MText>
      </View>
      <View role="region" aria-label="Resumen del inventario" flexDirection="row" gap={8}>
        <Figura label="Reponer" valor={r.porReponer} rojo testID="inventario-reponer" />
        <Figura label="Llegó hoy" valor={r.entradas} testID="inventario-entradas" />
        <Figura label="Mermas" valor={r.mermas} testID="inventario-mermas" />
      </View>
      <SegmentedTabs
        ariaLabel="Qué ver"
        value={p.tab}
        onChange={p.onTab}
        tabs={[
          { key: 'existencias', label: `Existencias · ${p.items.length}` },
          { key: 'movimientos', label: `Movimientos · ${p.movs.length}` },
        ]}
        testID="inventario-tabs"
      />
      {p.tab === 'existencias' ? <Buscador q={p.q} onQ={p.onQ} /> : null}
    </View>
  );
}
