/**
 * One sale of the turno (MvVentas' row): the folio, what it was, the amount;
 * under it the method chip, «Cancelada», the fiado client and the time. The
 * whole row opens the sale; a cancelled one is struck through and counts
 * nowhere.
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { METODO_TONO, type VentaTurno } from '@xangarro/caja/ventas';
import { MText } from '../../components/Mostrador/index';
import { borderWidths, colors } from '../../theme';
import { Cancelada, Etiqueta } from './ventas-partes';

export function MetodoEtiqueta({ metodo }: { readonly metodo: VentaTurno['metodo'] }) {
  const t = METODO_TONO[metodo];
  return <Etiqueta label={metodo} bg={t.bg} fg={t.fg} borde={t.borde} />;
}

const rayada = { textDecorationLine: 'line-through' } as const;

function ariaDe(v: VentaTurno): string {
  const partes = [`Ver venta ${v.folio}`, formatMoney(v.monto), v.metodo];
  if (v.cliente) partes.push(`a ${v.cliente}`);
  if (v.cancelada) partes.push('cancelada');
  return partes.join(', ');
}

function montoColor(v: VentaTurno): string {
  if (v.cancelada) return colors.textMuted;
  return v.metodo === 'Fiado' ? colors.warningText : colors.black;
}

function Arriba({ v }: { readonly v: VentaTurno }): ReactElement {
  const cancelada = v.cancelada !== undefined;
  return (
    <View flexDirection="row" alignItems="baseline" gap={8}>
      <MText size="sm" weight="extraBold" color={colors.gray600} fontVariant={['tabular-nums']}>
        {v.folio}
      </MText>
      <MText
        flex={1}
        minWidth={0}
        size="body"
        weight="bold"
        numberOfLines={1}
        textAlign="left"
        color={cancelada ? colors.textMuted : colors.black}
        style={cancelada ? rayada : undefined}
      >
        {v.concepto}
      </MText>
      <MText
        size="lg"
        weight="extraBold"
        color={montoColor(v)}
        fontVariant={['tabular-nums']}
        style={cancelada ? rayada : undefined}
      >
        {formatMoney(v.monto)}
      </MText>
    </View>
  );
}

function Abajo({ v }: { readonly v: VentaTurno }): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={6}>
      <MetodoEtiqueta metodo={v.metodo} />
      {v.cancelada ? <Cancelada /> : null}
      {v.cliente ? (
        <MText flexShrink={1} size="sm" weight="bold" color={colors.warningText} numberOfLines={1}>
          {v.cliente}
        </MText>
      ) : null}
      <View flex={1} />
      <MText size="sm" weight="semibold" color={colors.gray600} fontVariant={['tabular-nums']}>
        {v.hora}
      </MText>
    </View>
  );
}

export function VentaFila(p: {
  readonly v: VentaTurno;
  readonly abierta: boolean;
  readonly onPress: () => void;
}): ReactElement {
  return (
    <Pressable
      testID={`venta-fila-${p.v.folio}`}
      role="button"
      aria-label={ariaDe(p.v)}
      onPress={p.onPress}
      style={({ pressed }) => ({
        minHeight: 68,
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: borderWidths.quiet,
        borderBottomColor: colors.gray100,
        backgroundColor: pressed || p.abierta ? colors.yellowSoft : colors.white,
      })}
    >
      <Arriba v={p.v} />
      <Abajo v={p.v} />
    </Pressable>
  );
}
