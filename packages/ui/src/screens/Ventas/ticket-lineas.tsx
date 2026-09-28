/**
 * The ticket's lines (MvTicket; the tablet panel's list): each with its
 * stepper, what one costs and what the line comes to. The sheet draws them
 * roomy with the product icon and «Quitar»; the tablet panel compact.
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { importe, type LineaTicket } from '@xangarro/caja/caja';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import type { ProductoCobrar } from './cobrar-catalogo';
import { COBRAR_GLYPHS } from './cobrar-glyphs';
import { ProductoIcono } from './cobrar-tile';

export interface TicketLineasProps {
  readonly lines: readonly LineaTicket[];
  readonly info: ReadonlyMap<string, ProductoCobrar>;
  readonly onBump: (productoId: string, delta: number) => void;
  readonly onQuitar: (productoId: string) => void;
  readonly compacta?: boolean;
}

function Paso(p: {
  readonly d: string;
  readonly label: string;
  readonly onPress: () => void;
  readonly testID: string;
}): ReactElement {
  return (
    <Pressable
      testID={p.testID}
      role="button"
      aria-label={p.label}
      onPress={p.onPress}
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
    >
      <PathIcon d={p.d} size={18} strokeWidth={2.6} />
    </Pressable>
  );
}

export function Stepper(p: {
  readonly l: LineaTicket;
  readonly onBump: (id: string, d: number) => void;
}): ReactElement {
  const { l } = p;
  return (
    <View
      flexDirection="row"
      alignItems="center"
      borderRadius={radii[2]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
    >
      <Paso
        d={COBRAR_GLYPHS.menos}
        label={`Quitar uno de ${l.nombre}`}
        onPress={() => p.onBump(l.productoId, -1)}
        testID={`ticket-menos-${l.productoId}`}
      />
      <MText size="lg" weight="extraBold" minWidth={28} textAlign="center" aria-live="polite">
        {String(l.cantidad)}
      </MText>
      <Paso
        d={COBRAR_GLYPHS.mas}
        label={`Agregar uno de ${l.nombre}`}
        onPress={() => p.onBump(l.productoId, 1)}
        testID={`ticket-mas-${l.productoId}`}
      />
    </View>
  );
}

function Nombre({ l }: { l: LineaTicket }): ReactElement {
  return (
    <View flex={1} minWidth={0}>
      <MText size="body" weight="extraBold" numberOfLines={1}>
        {l.nombre}
      </MText>
      <MText size="sm" weight="semibold" color={colors.gray600}>
        {`${formatMoney(l.precio)} c/u`}
      </MText>
    </View>
  );
}

function LineaAmplia(p: TicketLineasProps & { readonly l: LineaTicket }): ReactElement {
  const { l } = p;
  const info = p.info.get(l.productoId);
  return (
    <View testID={`ticket-linea-${l.productoId}`} flexDirection="row" gap={12} paddingVertical={12}>
      {info ? <ProductoIcono icono={info.icono} tint={info.tint} /> : null}
      <View flex={1} gap={8}>
        <View flexDirection="row" gap={8}>
          <Nombre l={l} />
          <MText size="body" weight="extraBold">
            {formatMoney(importe(l))}
          </MText>
        </View>
        <View flexDirection="row" alignItems="center" justifyContent="space-between">
          <Stepper l={l} onBump={p.onBump} />
          <Pressable
            testID={`ticket-quitar-${l.productoId}`}
            role="button"
            aria-label={`Quitar ${l.nombre} del ticket`}
            onPress={() => p.onQuitar(l.productoId)}
            style={{ height: 44, flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <PathIcon d={COBRAR_GLYPHS.basura} size={16} color={colors.redText} />
            <MText size="md" weight="extraBold" color={colors.redText}>
              Quitar
            </MText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function LineaCompacta(p: TicketLineasProps & { readonly l: LineaTicket }): ReactElement {
  const { l } = p;
  return (
    <View
      testID={`ticket-linea-${l.productoId}`}
      flexDirection="row"
      alignItems="center"
      gap={10}
      paddingVertical={8}
    >
      <Nombre l={l} />
      <Stepper l={l} onBump={p.onBump} />
      <MText size="body" weight="extraBold" minWidth={76} textAlign="right">
        {formatMoney(importe(l))}
      </MText>
    </View>
  );
}

export function TicketLineas(p: TicketLineasProps): ReactElement {
  return (
    <View>
      {p.lines.map((l, i) => (
        <View
          key={l.productoId}
          borderTopWidth={i === 0 ? 0 : borderWidths.quiet}
          borderTopColor={borderColors.quiet}
        >
          {p.compacta ? <LineaCompacta {...p} l={l} /> : <LineaAmplia {...p} l={l} />}
        </View>
      ))}
    </View>
  );
}

/** «El ticket está vacío» and what to do about it. */
export function TicketVacio({ texto }: { readonly texto: string }): ReactElement {
  return (
    <View testID="ticket-vacio" paddingVertical={24} gap={6} alignItems="center">
      <MText size="lg" weight="extraBold">
        El ticket está vacío
      </MText>
      <MText weight="semibold" color={colors.gray600} textAlign="center">
        {texto}
      </MText>
    </View>
  );
}
