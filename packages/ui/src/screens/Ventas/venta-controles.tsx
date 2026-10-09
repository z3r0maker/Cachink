/**
 * The screen's fixed chrome (MvVentas): the title row, the search field, the
 * method chips and the amber note about cancelling. State-free — the screen
 * owns what they say.
 */
import type { ReactElement } from 'react';
import { TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { FILTROS, type MetodoVenta } from '@xangarro/caja/ventas';
import { Chip } from '../../components/Chip/index';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import {
  borderColors,
  borderWidths,
  colors,
  portalFontSizes,
  radii,
  typography,
} from '../../theme';
import { COBRAR_GLYPHS } from './cobrar-glyphs';

export type FiltroVenta = 'Todos' | MetodoVenta;

export function Cabecera({ desde }: { readonly desde: string }): ReactElement {
  return (
    <View gap={2} testID="venta-cabecera">
      <MText size="xl4" weight="extraBold" letterSpacing={-0.9} role="heading">
        Ventas del turno
      </MText>
      <MText size="md" weight="semibold" color={colors.gray600}>
        {`Lo que cobraste desde las ${desde}`}
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
        testID="venta-buscar"
        aria-label="Buscar venta"
        placeholder="Busca por folio, producto o cliente"
        placeholderTextColor={colors.textMuted}
        value={p.q}
        onChangeText={p.onQ}
        style={{
          flex: 1,
          height: 44,
          fontFamily: typography.fontFamily,
          fontWeight: '600',
          fontSize: portalFontSizes.md,
          color: colors.black,
        }}
      />
    </View>
  );
}

export function Filtros(p: {
  readonly filtro: FiltroVenta;
  readonly onFiltro: (f: FiltroVenta) => void;
}): ReactElement {
  return (
    <View flexDirection="row" flexWrap="wrap" gap={8} role="radiogroup" aria-label="Cómo pagaron">
      {FILTROS.map((f) => (
        <Chip
          key={f.valor}
          label={f.label}
          selected={p.filtro === f.valor}
          onPress={() => p.onFiltro(f.valor)}
          testID={`venta-filtro-${f.valor}`}
        />
      ))}
    </View>
  );
}

/** The board's amber note: cancelling needs a motivo, and nothing is deleted. */
export function NotaAmbar({ dueno }: { readonly dueno: string }): ReactElement {
  return (
    <View
      flexDirection="row"
      gap={10}
      padding={12}
      borderRadius={radii[3]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.yellowSoft}
      testID="venta-nota"
    >
      <PathIcon d={COBRAR_GLYPHS.info} size={18} />
      <MText size="sm" weight="semibold" color={colors.ink} flex={1}>
        {`Puedes cancelar ventas de este turno con un motivo. La venta no se borra: queda marcada como cancelada y ${dueno} la ve en su portal y en tu corte.`}
      </MText>
    </View>
  );
}
