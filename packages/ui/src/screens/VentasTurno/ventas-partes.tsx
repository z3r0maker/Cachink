/**
 * The pieces above MvVentas' list: the small pill the rows and the sheet
 * wear (the method, «Cancelada»), the turno's three figures, the search and
 * the method chips (Todas and the four).
 */
import type { ReactElement } from 'react';
import { ScrollView, TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { FILTROS, type MetodoVenta, type ResumenVentas } from '@xangarro/caja/ventas';
import { Chip } from '../../components/Chip/index';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import {
  borderColors,
  borderWidths,
  colors,
  portalFontSizes,
  radii,
  shapeRadii,
  typography,
} from '../../theme';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';

export type FiltroVenta = 'Todos' | MetodoVenta;

/** A read-only pill: a soft fill, its text colour and a 2 px edge. */
export function Etiqueta(p: {
  readonly label: string;
  readonly bg: string;
  readonly fg: string;
  readonly borde: string;
  readonly testID?: string;
}): ReactElement {
  return (
    <View
      testID={p.testID}
      paddingHorizontal={9}
      paddingVertical={1}
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={p.borde}
      backgroundColor={p.bg}
    >
      <MText size="xs" weight="extraBold" color={p.fg} numberOfLines={1}>
        {p.label}
      </MText>
    </View>
  );
}

export function Cancelada({ testID }: { readonly testID?: string }): ReactElement {
  return (
    <Etiqueta
      label="Cancelada"
      bg={colors.redSoft}
      fg={colors.redText}
      borde={colors.redText}
      testID={testID}
    />
  );
}

function Cifra(p: {
  readonly k: string;
  readonly v: string;
  readonly color?: string;
  readonly flex: number;
  readonly ultima?: boolean;
}): ReactElement {
  return (
    <View
      flex={p.flex}
      minWidth={0}
      paddingHorizontal={12}
      borderRightWidth={p.ultima ? 0 : borderWidths.quiet}
      borderRightColor={borderColors.quiet}
      aria-label={`${p.k}: ${p.v}`}
    >
      <MText size="xs" weight="bold" color={colors.gray600}>
        {p.k}
      </MText>
      <MText
        size="sectionTitle"
        weight="extraBold"
        color={p.color}
        numberOfLines={1}
        adjustsFontSizeToFit
        fontVariant={['tabular-nums']}
      >
        {p.v}
      </MText>
    </View>
  );
}

/** Cobrado, En efectivo, Canceladas: a cancelled sale counts nowhere (rule 6). */
export function ResumenTurno({ r }: { readonly r: ResumenVentas }): ReactElement {
  return (
    <View
      testID="ventas-resumen"
      role="summary"
      aria-label="Resumen del turno"
      flexDirection="row"
      paddingVertical={10}
      borderRadius={radii[5]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.white}
    >
      <Cifra flex={1.25} k="Cobrado" v={formatMoney(r.cobrado)} />
      <Cifra flex={1.25} k="En efectivo" v={formatMoney(r.efectivo)} color={colors.greenText} />
      <Cifra flex={1} k="Canceladas" v={String(r.canceladas)} ultima />
    </View>
  );
}

export function Buscador(p: {
  readonly value: string;
  readonly onChange: (q: string) => void;
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
        testID="ventas-buscar"
        aria-label="Buscar venta"
        placeholder="Busca por folio, producto o cliente"
        placeholderTextColor={colors.textMuted}
        value={p.value}
        onChangeText={p.onChange}
        returnKeyType="search"
        style={{
          flex: 1,
          minWidth: 0,
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

export function FiltrosMetodo(p: {
  readonly value: FiltroVenta;
  readonly onChange: (f: FiltroVenta) => void;
}): ReactElement {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      role="radiogroup"
      aria-label="Cómo pagaron"
      contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 10, paddingTop: 4 }}
    >
      {FILTROS.map((f) => (
        <Chip
          key={f.valor}
          label={f.label}
          selected={p.value === f.valor}
          onPress={() => p.onChange(f.valor)}
          testID={`ventas-filtro-${f.valor}`}
        />
      ))}
    </ScrollView>
  );
}
