/**
 * The screen's fixed chrome (MvVentas): the title row, the search field and
 * the method chips. State-free — the screen owns what they say.
 */
import type { ReactElement } from 'react';
import { ScrollView, TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { FILTROS, enTuTurno, type MetodoVenta } from '@xangarro/caja/ventas';
import { Chip } from '../../components/Chip/index';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderWidths, colors, fontFace, portalFontSizes, radii, typography } from '../../theme';
import { COBRAR_GLYPHS } from './cobrar-glyphs';

export type FiltroVenta = 'Todos' | MetodoVenta;

/** «Ventas» and, beside it, how many and since when (MvVentas). */
export function Cabecera(p: { readonly activas: number; readonly desde: string }): ReactElement {
  return (
    <View flexDirection="row" alignItems="baseline" gap={10} testID="venta-cabecera">
      <MText size="xl4" weight="extraBold" letterSpacing={-0.9} role="heading">
        Ventas
      </MText>
      <MText size="md" weight="semibold" color={colors.gray600} flexShrink={1} numberOfLines={1}>
        {enTuTurno(p.activas, p.desde)}
      </MText>
    </View>
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
      <PathIcon d={COBRAR_GLYPHS.buscar} size={18} color={colors.gray600} />
      <TextInput
        autoCorrect={false}
        testID="venta-buscar"
        aria-label="Buscar venta"
        placeholder="Busca por folio, producto o cliente"
        placeholderTextColor={colors.textMuted}
        value={p.q}
        onChangeText={p.onQ}
        style={{
          flex: 1,
          height: 44,
          ...fontFace(typography.weights.semibold),
          fontSize: portalFontSizes.md,
          color: colors.black,
        }}
      />
    </View>
  );
}

/** The method chips in one row that scrolls sideways, never wrapping (MvVentas). */
export function Filtros(p: {
  readonly filtro: FiltroVenta;
  readonly onFiltro: (f: FiltroVenta) => void;
}): ReactElement {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      role="radiogroup"
      aria-label="Cómo pagaron"
      testID="venta-filtros"
      style={{ flexGrow: 0 }}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
    >
      {FILTROS.map((f) => (
        <Chip
          key={f.valor}
          label={f.label}
          selected={p.filtro === f.valor}
          onPress={() => p.onFiltro(f.valor)}
          testID={`venta-filtro-${f.valor}`}
        />
      ))}
    </ScrollView>
  );
}
