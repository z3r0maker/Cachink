/**
 * MvGastos' pieces: the summary (what left the drawer and how many), the
 * category chips and one row per gasto with its category's tint and glyph.
 * A gasto is read-only here: editing or deleting it is the owner's, in the
 * portal.
 */
import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import {
  CAT_ICON,
  CAT_TINT,
  CAT_TINTA,
  CATEGORIAS,
  type CategoriaGasto,
  type GastoTurno,
  type ResumenGastos,
} from '@xangarro/caja/gastos';
import { Chip } from '../../components/Chip/index';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { Etiqueta } from '../VentasTurno/ventas-partes';

export type FiltroGasto = 'Todos' | CategoriaGasto;

export function ResumenGastosTurno({ r }: { readonly r: ResumenGastos }): ReactElement {
  return (
    <View
      testID="gastos-resumen"
      flexDirection="row"
      alignItems="flex-end"
      gap={10}
      paddingVertical={12}
      paddingHorizontal={14}
      borderRadius={radii[5]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.white}
    >
      <View flex={1} aria-label={`Salió de caja chica: ${formatMoney(r.total)}`}>
        <MText size="xs" weight="bold" color={colors.gray600}>
          Salió de caja chica
        </MText>
        <MText size="xl4" weight="extraBold" color={colors.redText} fontVariant={['tabular-nums']}>
          {formatMoney(r.total)}
        </MText>
      </View>
      <View alignItems="flex-end" aria-label={`Gastos: ${r.cuantos}`}>
        <MText size="xs" weight="bold" color={colors.gray600}>
          Gastos
        </MText>
        <MText size="cardTitle" weight="extraBold" fontVariant={['tabular-nums']}>
          {String(r.cuantos)}
        </MText>
      </View>
    </View>
  );
}

export function FiltrosCategoria(p: {
  readonly value: FiltroGasto;
  readonly onChange: (f: FiltroGasto) => void;
}): ReactElement {
  const opciones: readonly FiltroGasto[] = ['Todos', ...CATEGORIAS];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      role="radiogroup"
      aria-label="Categoría"
      contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 10, paddingTop: 4 }}
    >
      {opciones.map((c) => (
        <Chip
          key={c}
          label={c}
          selected={p.value === c}
          onPress={() => p.onChange(c)}
          testID={`gastos-filtro-${c}`}
        />
      ))}
    </ScrollView>
  );
}

export function CategoriaIcono(p: { readonly c: CategoriaGasto; readonly size?: number }) {
  const size = p.size ?? 44;
  return (
    <View
      width={size}
      height={size}
      alignItems="center"
      justifyContent="center"
      borderRadius={radii[2]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={CAT_TINT[p.c]}
      aria-hidden
    >
      <PathIcon d={CAT_ICON[p.c]} size={Math.round(size * 0.45)} />
    </View>
  );
}

function Arriba({ g }: { readonly g: GastoTurno }): ReactElement {
  return (
    <View flexDirection="row" alignItems="baseline" gap={8}>
      <MText flex={1} minWidth={0} size="body" weight="extraBold" numberOfLines={1}>
        {g.concepto}
      </MText>
      <MText size="body" weight="extraBold" color={colors.redText} fontVariant={['tabular-nums']}>
        {`−${formatMoney(g.monto)}`}
      </MText>
    </View>
  );
}

function Abajo({ g }: { readonly g: GastoTurno }): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={6}>
      <Etiqueta
        label={g.categoria}
        bg={CAT_TINT[g.categoria]}
        fg={CAT_TINTA[g.categoria]}
        borde={CAT_TINTA[g.categoria]}
      />
      {g.detalle ? (
        <MText
          flexShrink={1}
          size="sm"
          weight="semibold"
          color={colors.textMuted}
          numberOfLines={1}
        >
          {g.detalle}
        </MText>
      ) : null}
      <View flex={1} />
      <MText size="sm" weight="semibold" color={colors.gray600} fontVariant={['tabular-nums']}>
        {g.hora}
      </MText>
    </View>
  );
}

export function GastoFila({ g }: { readonly g: GastoTurno }): ReactElement {
  return (
    <View
      testID={`gasto-fila-${g.id}`}
      aria-label={`${g.concepto}, ${formatMoney(g.monto)}, ${g.categoria}, ${g.hora}`}
      flexDirection="row"
      alignItems="center"
      gap={12}
      paddingVertical={12}
      paddingHorizontal={14}
      borderBottomWidth={borderWidths.quiet}
      borderBottomColor={colors.gray100}
    >
      <CategoriaIcono c={g.categoria} />
      <View flex={1} minWidth={0} gap={4}>
        <Arriba g={g} />
        <Abajo g={g} />
      </View>
    </View>
  );
}
