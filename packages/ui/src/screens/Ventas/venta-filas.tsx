/**
 * The turno's rows (MvVentas): folio, every product sold and the amount on
 * the first line; how they paid, the fiado client and the hora on the
 * second. A cancelled sale stays, struck through with its red chip (rule 6).
 * Tapping a row opens its ticket; the open one keeps the soft yellow.
 */
import type { ReactElement } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { METODO_TONO, clienteDeFila, etiquetaFila, type VentaTurno } from '@xangarro/caja/ventas';
import { MText } from '../../components/Mostrador/index';
import { QuietPanel } from '../../components/Panel/index';
import { borderColors, borderWidths, colors, radii, shapeRadii } from '../../theme';

const NUMEROS = { fontVariant: ['tabular-nums' as const] };

function Chippeado(p: {
  readonly bg: string;
  readonly fg: string;
  readonly borde: string;
  readonly texto: string;
}): ReactElement {
  return (
    <View
      borderWidth={borderWidths.quiet}
      borderColor={p.borde}
      backgroundColor={p.bg}
      borderRadius={shapeRadii.pill}
      paddingHorizontal={9}
      paddingVertical={2}
      flexShrink={0}
    >
      <MText size="xs" weight="extraBold" color={p.fg}>
        {p.texto}
      </MText>
    </View>
  );
}

/** Folio, the lines on one line (ellipsis), and the amount. */
function Arriba({ x }: { readonly x: VentaTurno }): ReactElement {
  const cancelada = x.cancelada !== undefined;
  const tachado = { textDecorationLine: cancelada ? 'line-through' : 'none' } as const;
  const fiado = x.metodo === 'Fiado' ? colors.warningText : colors.black;
  return (
    <View flexDirection="row" alignItems="baseline" gap={8}>
      <MText size="sm" weight="extraBold" color={colors.gray600} style={NUMEROS}>
        {x.folio}
      </MText>
      <MText
        size="body"
        weight="bold"
        flex={1}
        numberOfLines={1}
        ellipsizeMode="tail"
        color={cancelada ? colors.textMuted : colors.black}
        style={tachado}
      >
        {x.concepto}
      </MText>
      <MText
        size="lg"
        weight="extraBold"
        color={cancelada ? colors.textMuted : fiado}
        style={{ ...tachado, ...NUMEROS }}
      >
        {formatMoney(x.monto)}
      </MText>
    </View>
  );
}

/** The method chip, «Cancelada», the fiado client, and the hora at the end. */
function Abajo({ x }: { readonly x: VentaTurno }): ReactElement {
  const cliente = clienteDeFila(x);
  return (
    <View flexDirection="row" alignItems="center" gap={6}>
      <Chippeado {...METODO_TONO[x.metodo]} texto={x.metodo} />
      {x.cancelada ? (
        <Chippeado
          bg={colors.redSoft}
          fg={colors.redText}
          borde={colors.redText}
          texto="Cancelada"
        />
      ) : null}
      {cliente === null ? null : (
        <MText size="sm" weight="bold" color={colors.warningText} numberOfLines={1} flexShrink={1}>
          {cliente}
        </MText>
      )}
      <MText
        size="sm"
        weight="semibold"
        color={colors.gray600}
        marginLeft="auto"
        flexShrink={0}
        style={NUMEROS}
      >
        {x.hora}
      </MText>
    </View>
  );
}

function Fila(p: {
  readonly x: VentaTurno;
  readonly abierta: boolean;
  readonly onAbrir: (folio: string) => void;
}): ReactElement {
  return (
    <Pressable
      testID={`venta-fila-${p.x.folio}`}
      role="button"
      aria-label={etiquetaFila(p.x)}
      onPress={() => p.onAbrir(p.x.folio)}
      style={({ pressed }) => ({
        minHeight: 68,
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: pressed || p.abierta ? colors.yellowSoft : colors.white,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: borderColors.quiet,
      })}
    >
      <Arriba x={p.x} />
      <Abajo x={p.x} />
    </Pressable>
  );
}

/** The list in one quiet panel; the board's empty-filter note when nothing matches. */
export function ListaVentas(p: {
  readonly ventas: readonly VentaTurno[];
  /** The folio whose sheet is open, highlighted as on the board. */
  readonly abierta: string | null;
  readonly onAbrir: (folio: string) => void;
}): ReactElement {
  return (
    <QuietPanel testID="venta-lista" padding={0}>
      {p.ventas.map((x) => (
        <Fila key={x.folio} x={x} abierta={p.abierta === x.folio} onAbrir={p.onAbrir} />
      ))}
      {p.ventas.length === 0 ? (
        <View padding={24} gap={6} alignItems="center" borderRadius={radii[2]}>
          <MText size="lg" weight="extraBold" textAlign="center">
            No hay ventas con ese filtro
          </MText>
          <MText size="md" weight="semibold" color={colors.gray600} textAlign="center">
            Prueba con otra forma de pago o borra la búsqueda.
          </MText>
        </View>
      ) : null}
    </QuietPanel>
  );
}
