/**
 * The strip above the Gastos list (M-08): the three quiet figures — how
 * many, how much left the drawer (red), how many lack a receipt (amber, with
 * the owner's note) — then the search box and the category chips, the words
 * the web's `Cifras` and filters say.
 */
import type { ReactElement } from 'react';
import { ScrollView, TextInput } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { mayuscula } from '@xangarro/caja';
import { CATEGORIAS, resumen, type CategoriaGasto, type GastosData } from '@xangarro/caja/gastos';
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
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';

const TILE = {
  borderWidth: borderWidths.quiet,
  borderColor: borderColors.quiet,
  borderRadius: radii[5],
  backgroundColor: colors.white,
  paddingHorizontal: 14,
  paddingVertical: 12,
  gap: 3,
} as const;

function Cifra(p: {
  readonly label: string;
  readonly value: string;
  readonly color?: string;
  readonly nota?: string;
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
      {p.nota === undefined ? null : (
        <MText size="xs" weight="semibold" color={colors.gray600}>
          {p.nota}
        </MText>
      )}
    </View>
  );
}

export function Cifras({ data }: { readonly data: GastosData }): ReactElement {
  const r = resumen(data.gastos);
  return (
    <View testID="gastos-cifras" gap={10}>
      <Cifra label="Gastos del turno" value={String(r.cuantos)} />
      <Cifra label="Salió de caja" value={formatMoney(r.total)} color={colors.redText} />
      <Cifra
        label="Sin comprobante"
        value={String(r.sinComprobante)}
        color={colors.warningText}
        nota={`${mayuscula(data.dueno ?? 'el dueño')} te lo va a preguntar`}
      />
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
      <PathIcon d={COBRAR_GLYPHS.buscar} size={18} strokeWidth={2.4} color={colors.gray600} />
      <TextInput
        testID="gastos-buscar"
        aria-label="Buscar gasto"
        placeholder="Buscar por concepto o proveedor"
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
