/**
 * How the customer pays (MvCobroTotal): one row with Efectivo, Tarjeta and
 * Transferencia as a radio group, and Fiado beside them, which goes on to
 * choose the client. The card and transfer panels say what to check before
 * tapping Cobrar.
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

/** Wide enough for its word: «Transferencia» takes more of the row than «Fiado». */
const SEGMENTO = {
  flexGrow: 1,
  flexShrink: 1,
  flexBasis: 'auto',
  minWidth: 0,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  paddingHorizontal: 6,
  borderRadius: radii[2],
} as const;

function Palabra(p: { color: string; children: string }): ReactElement {
  return (
    <MText
      size="xs"
      weight="extraBold"
      color={p.color}
      numberOfLines={1}
      adjustsFontSizeToFit
      maxFontSizeMultiplier={1.2}
    >
      {p.children}
    </MText>
  );
}

function MetodoBoton(p: { m: Pago; on: boolean; alto: number; onPress: () => void }): ReactElement {
  const tinta = p.on ? colors.yellow : colors.black;
  return (
    <Pressable
      testID={`cobro-metodo-${p.m}`}
      role="radio"
      aria-checked={p.on}
      aria-label={p.m}
      onPress={p.onPress}
      style={{
        ...SEGMENTO,
        height: p.alto,
        borderWidth: p.on ? borderWidths.thin : borderWidths.quiet,
        borderColor: p.on ? colors.black : borderColors.quiet,
        backgroundColor: p.on ? colors.black : colors.white,
      }}
    >
      <PathIcon d={ICONO[p.m]} size={16} color={tinta} />
      <Palabra color={tinta}>{p.m}</Palabra>
    </Pressable>
  );
}

function FiadoBoton(p: { alto: number; onPress: () => void }): ReactElement {
  return (
    <Pressable
      testID="cobro-fiado"
      role="button"
      aria-label="Fiado, elegir a quién se lo anotas"
      onPress={p.onPress}
      style={{
        ...SEGMENTO,
        height: p.alto,
        borderWidth: borderWidths.quiet,
        borderColor: borderColors.quiet,
        backgroundColor: colors.white,
      }}
    >
      <PathIcon d={COBRAR_GLYPHS.fiado} size={16} />
      <View flexDirection="row" alignItems="center" gap={1}>
        <Palabra color={colors.black}>Fiado</Palabra>
        <PathIcon d={GLYPHS.chevronRight} size={12} color={colors.gray600} />
      </View>
    </Pressable>
  );
}

export function Metodos(p: {
  readonly metodos: readonly MetodoCobro[];
  readonly metodo: MetodoCobro;
  readonly alto: number;
  readonly onMetodo: (m: MetodoCobro) => void;
  readonly onFiado: () => void;
}): ReactElement {
  const pagos = p.metodos.filter((m): m is Pago => m !== 'Fiado');
  return (
    <View flexDirection="row" gap={6}>
      <View
        role="radiogroup"
        aria-label="Forma de pago"
        flexDirection="row"
        flexGrow={3}
        flexShrink={1}
        minWidth={0}
        gap={6}
      >
        {pagos.map((m) => (
          <MetodoBoton
            key={m}
            m={m}
            on={p.metodo === m}
            alto={p.alto}
            onPress={() => p.onMetodo(m)}
          />
        ))}
      </View>
      {p.metodos.includes('Fiado') ? <FiadoBoton alto={p.alto} onPress={p.onFiado} /> : null}
    </View>
  );
}

const PANEL = {
  Tarjeta: {
    fondo: colors.blueSoft,
    titulo: (monto: string) => `Cobra ${monto} en la terminal`,
    nota: 'Cuando la terminal diga que pasó el pago, toca Cobrar.',
  },
  Transferencia: {
    fondo: colors.greenSoft,
    titulo: (monto: string) => `Pídele que te transfiera ${monto}`,
    nota: 'Revisa que ya te llegó antes de tocar Cobrar.',
  },
} as const;

/** Tarjeta or Transferencia: the one thing to check before «Cobrar». */
export function PanelSinEfectivo(p: {
  readonly metodo: 'Tarjeta' | 'Transferencia';
  readonly total: Money;
}): ReactElement {
  const panel = PANEL[p.metodo];
  return (
    <View
      testID={`cobro-panel-${p.metodo}`}
      flex={1}
      alignItems="center"
      justifyContent="center"
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
        backgroundColor={panel.fondo}
      >
        <PathIcon d={ICONO[p.metodo]} size={28} />
      </View>
      <MText size="xl" weight="extraBold" textAlign="center">
        {panel.titulo(formatMoney(p.total))}
      </MText>
      <MText weight="semibold" color={colors.gray600} textAlign="center">
        {panel.nota}
      </MText>
    </View>
  );
}
