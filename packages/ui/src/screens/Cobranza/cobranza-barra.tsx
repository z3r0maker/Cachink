/**
 * The list's search and filters (MvCobranzaLista): the client search (name or
 * phone) and the board's three filters — Todos, Con saldo, Atrasados — as
 * chips; the chosen one is black with yellow text (§2).
 */
import type { ReactElement } from 'react';
import { TextInput } from 'react-native';
import { View } from '@tamagui/core';
import type { FiltroCobranza } from '@xangarro/caja/cobranza';
import { Chip } from '../../components/Chip/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderWidths, colors, portalFontSizes, radii, typography } from '../../theme';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';

export const FILTROS: readonly FiltroCobranza[] = ['Todos', 'Con saldo', 'Atrasados'];

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
        testID="cobranza-buscar"
        aria-label="Buscar cliente"
        placeholder="Busca por nombre o teléfono"
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

export function Filtros(p: {
  readonly value: FiltroCobranza;
  readonly onChange: (f: FiltroCobranza) => void;
}): ReactElement {
  return (
    <View
      role="radiogroup"
      aria-label="Filtrar clientes"
      flexDirection="row"
      gap={8}
      testID="cobranza-filtros"
    >
      {FILTROS.map((f) => (
        <Chip
          key={f}
          label={f}
          selected={p.value === f}
          onPress={() => p.onChange(f)}
          testID={`cobranza-filtro-${f.replace(' ', '-')}`}
        />
      ))}
    </View>
  );
}
