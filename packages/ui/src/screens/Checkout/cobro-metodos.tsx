/**
 * «¿Cómo paga?» (MvCobro): Efectivo, Tarjeta and Transferencia as a radio
 * group, and Fiado as its own row that goes on to choose the client. The
 * card and transfer panels say what to check before tapping Cobrar.
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney, type Money } from '@xangarro/domain';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { GLYPHS } from '../../components/PathIcon/glyphs';
import { borderColors, borderWidths, colors, radii, shapeRadii } from '../../theme';
import { COBRAR_GLYPHS } from '../Ventas/cobrar-glyphs';
import type { MetodoCobro } from './cobro-logic';

const ICONO: Record<'Efectivo' | 'Tarjeta' | 'Transferencia', string> = {
  Efectivo: COBRAR_GLYPHS.efectivo,
  Tarjeta: COBRAR_GLYPHS.tarjeta,
  Transferencia: COBRAR_GLYPHS.transferencia,
};

type Pago = Exclude<MetodoCobro, 'Fiado'>;

const BOTON = {
  flex: 1,
  height: 64,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  borderRadius: radii[3],
  borderWidth: borderWidths.thin,
} as const;

function MetodoBoton(p: { m: Pago; on: boolean; onPress: () => void }): ReactElement {
  const tinta = p.on ? colors.yellow : colors.black;
  return (
    <Pressable
      testID={`cobro-metodo-${p.m}`}
      role="radio"
      aria-checked={p.on}
      aria-label={p.m}
      onPress={p.onPress}
      style={{
        ...BOTON,
        borderColor: p.on ? colors.black : borderColors.quiet,
        backgroundColor: p.on ? colors.black : colors.white,
      }}
    >
      <PathIcon d={ICONO[p.m]} size={20} color={tinta} />
      <MText size="sm" weight="extraBold" color={tinta} numberOfLines={1}>
        {p.m}
      </MText>
    </Pressable>
  );
}

const FILA = {
  height: 52,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  paddingHorizontal: 14,
  borderRadius: radii[3],
  borderWidth: borderWidths.quiet,
  borderColor: borderColors.quiet,
  backgroundColor: colors.white,
} as const;

function FiadoFila({ onPress }: { onPress: () => void }): ReactElement {
  return (
    <Pressable
      testID="cobro-fiado"
      role="button"
      aria-label="Fiado, elegir a quién se lo anotas"
      onPress={onPress}
      style={FILA}
    >
      <PathIcon d={COBRAR_GLYPHS.fiado} size={20} />
      <MText flex={1} size="body" weight="extraBold" textAlign="left">
        Fiado
      </MText>
      <PathIcon d={GLYPHS.chevronRight} size={18} color={colors.gray600} />
    </Pressable>
  );
}

export function Metodos(p: {
  readonly metodos: readonly MetodoCobro[];
  readonly metodo: MetodoCobro;
  readonly onMetodo: (m: MetodoCobro) => void;
  readonly onFiado: () => void;
}): ReactElement {
  const pagos = p.metodos.filter((m): m is Pago => m !== 'Fiado');
  return (
    <View gap={8}>
      <View role="radiogroup" aria-label="Forma de pago" flexDirection="row" gap={8}>
        {pagos.map((m) => (
          <MetodoBoton key={m} m={m} on={p.metodo === m} onPress={() => p.onMetodo(m)} />
        ))}
      </View>
      {p.metodos.includes('Fiado') ? <FiadoFila onPress={p.onFiado} /> : null}
    </View>
  );
}

/** Tarjeta or Transferencia: the one thing to check before «Cobrar». */
export function PanelSinEfectivo(p: {
  readonly metodo: 'Tarjeta' | 'Transferencia';
  readonly total: Money;
}): ReactElement {
  const monto = formatMoney(p.total);
  const tarjeta = p.metodo === 'Tarjeta';
  return (
    <View
      testID={`cobro-panel-${p.metodo}`}
      alignItems="center"
      gap={10}
      padding={20}
      borderRadius={radii[5]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.white}
    >
      <View
        width={64}
        height={64}
        alignItems="center"
        justifyContent="center"
        borderRadius={shapeRadii.pill}
        borderWidth={borderWidths.thin}
        borderColor={colors.black}
        backgroundColor={tarjeta ? colors.blueSoft : colors.greenSoft}
      >
        <PathIcon d={ICONO[p.metodo]} size={28} />
      </View>
      <MText size="xl" weight="extraBold" textAlign="center">
        {tarjeta ? `Cobra ${monto} en la terminal` : `Pídele que te transfiera ${monto}`}
      </MText>
      <MText weight="semibold" color={colors.gray600} textAlign="center">
        {tarjeta
          ? 'Cuando la terminal diga que pasó el pago, toca Cobrar.'
          : 'Revisa que ya te llegó antes de tocar Cobrar.'}
      </MText>
    </View>
  );
}
