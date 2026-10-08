/**
 * «La cola» (MvPendientes): each record the caja still has to send, in the
 * order the pusher meets them, with its kind, time, what it was, its state
 * chip («En cola», «Esperando conexión», «En reintento», «Enviando»), for a
 * row in retry its last and next attempt in gray (DS-07), and its amount.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { Reintento } from '@xangarro/caja';
import {
  estadoFila,
  lineaIntento,
  type EstadoFila,
  type Fase,
  type RegistroEnCola,
} from '@xangarro/caja/pendientes';
import { formatMoney } from '@xangarro/domain';
import { MText, PathIcon, QuietPanel } from '../../components/index';
import { borderWidths, colors, radii, shapeRadii } from '../../theme';
import { TIPO } from './pendientes-logica';

type Estado = EstadoFila;

function EstadoChip({ estado }: { readonly estado: Estado }): ReactElement {
  const enviando = estado === 'Enviando';
  const tinta = enviando ? colors.blueText : colors.warningText;
  return (
    <View
      alignSelf="flex-start"
      flexDirection="row"
      alignItems="center"
      gap={5}
      paddingHorizontal={8}
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.quiet}
      borderColor={tinta}
      backgroundColor={enviando ? colors.blueSoft : colors.warningSoft}
    >
      <View
        width={7}
        height={7}
        borderRadius={shapeRadii.pill}
        backgroundColor={enviando ? colors.blueText : colors.warning}
      />
      <MText size="xs" weight="extraBold" color={tinta}>
        {estado}
      </MText>
    </View>
  );
}

const TILE = {
  width: 44,
  height: 44,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radii[3],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
} as const;

function Texto(p: { r: RegistroEnCola; estado: Estado; linea: string | null }): ReactElement {
  return (
    <View flex={1} minWidth={0} gap={3}>
      <View flexDirection="row" alignItems="center" gap={8}>
        <MText size="body" weight="extraBold" numberOfLines={1} flexShrink={1}>
          {p.r.titulo}
        </MText>
        <MText size="xs" color={colors.textMuted} fontVariant={['tabular-nums']}>
          {p.r.hora}
        </MText>
      </View>
      {p.r.detalle ? (
        <MText size="sm" weight="semibold" color={colors.textMuted} numberOfLines={2}>
          {p.r.detalle}
        </MText>
      ) : null}
      <EstadoChip estado={p.estado} />
      {p.linea === null ? null : (
        <MText
          size="sm"
          weight="semibold"
          color={colors.textMuted}
          fontVariant={['tabular-nums']}
          testID={`pendiente-intento-${p.r.id}`}
        >
          {p.linea}
        </MText>
      )}
    </View>
  );
}

function Fila(p: {
  readonly r: RegistroEnCola;
  readonly estado: Estado;
  readonly linea: string | null;
  readonly ultima: boolean;
}): ReactElement {
  const t = TIPO[p.r.tipo];
  const monto = p.r.monto === null ? '' : `${t.signo}${formatMoney(p.r.monto)}`;
  return (
    <View
      testID={`pendiente-${p.r.id}`}
      role="listitem"
      aria-label={[p.r.titulo, p.r.hora, p.r.detalle, p.estado, p.linea, monto]
        .filter(Boolean)
        .join(', ')}
      flexDirection="row"
      alignItems="center"
      gap={12}
      minHeight={80}
      paddingHorizontal={14}
      paddingVertical={12}
      borderBottomWidth={p.ultima ? 0 : 1}
      borderBottomColor={colors.gray100}
    >
      <View {...TILE} backgroundColor={t.tint} aria-hidden>
        <PathIcon d={t.icon} size={20} />
      </View>
      <Texto r={p.r} estado={p.estado} linea={p.linea} />
      {monto ? (
        <MText size="lg" weight="extraBold" color={t.color} fontVariant={['tabular-nums']}>
          {monto}
        </MText>
      ) : null}
    </View>
  );
}

export function ListaCola(p: {
  readonly cola: readonly RegistroEnCola[];
  readonly fase: Fase;
  readonly offline: boolean;
  readonly ahora: number;
  readonly reintento: Reintento | null;
}): ReactElement {
  return (
    <QuietPanel
      label="La cola"
      count={p.cola.length}
      note="Se envían en este orden"
      testID="pendientes-cola"
    >
      <View role="list">
        {p.cola.map((r, i) => (
          <Fila
            key={r.id}
            r={r}
            estado={estadoFila(p.fase, p.offline, r)}
            linea={lineaIntento(r, p.ahora, p.reintento)}
            ultima={i === p.cola.length - 1}
          />
        ))}
      </View>
    </QuietPanel>
  );
}
