/**
 * The turno's rows (MvVentas): folio, what was sold, how they paid, when and
 * for how much. A cancelled sale stays, grey and struck through with its red
 * chip (rule 6); a fiado row says its client. Tapping a row opens its ticket.
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { METODO_TONO, type VentaTurno } from '@xangarro/caja/ventas';
import { MText } from '../../components/Mostrador/index';
import { QuietPanel } from '../../components/Panel/index';
import { borderColors, borderWidths, colors, radii, shapeRadii } from '../../theme';

type Ctx = { readonly operador: string; readonly caja: string };

/** The row's second line: the client, or who and where it was captured. */
function detalleDe(x: VentaTurno, ctx: Ctx): string {
  if (x.cancelada) return `Cancelada · ${x.cancelada.motivo}`;
  return x.cliente ?? `${ctx.operador} · ${ctx.caja}`;
}

function Chippeado(p: {
  readonly bg: string;
  readonly fg: string;
  readonly borde: string;
  readonly texto: string;
  readonly testID?: string;
}): ReactElement {
  return (
    <View
      testID={p.testID}
      borderWidth={borderWidths.thin}
      borderColor={p.borde}
      backgroundColor={p.bg}
      borderRadius={shapeRadii.pill}
      paddingHorizontal={10}
      paddingVertical={3}
      alignSelf="flex-start"
    >
      <MText size="xs" weight="bold" color={p.fg}>
        {p.texto}
      </MText>
    </View>
  );
}

/** Folio and hora above, concepto and monto below: the row's two text lines. */
function Textos(p: { readonly x: VentaTurno; readonly cancelada: boolean }): ReactElement {
  const tachado = p.cancelada ? 'line-through' : 'none';
  const color = p.cancelada ? colors.gray400 : colors.black;
  return (
    <>
      <View flexDirection="row" justifyContent="space-between" gap={10}>
        <MText size="xs" weight="extraBold" color={colors.gray600}>
          {p.x.folio}
        </MText>
        <MText size="xs" weight="bold" color={colors.gray600}>
          {p.x.hora}
        </MText>
      </View>
      <View flexDirection="row" alignItems="center" justifyContent="space-between" gap={10}>
        <MText
          size="body"
          weight="bold"
          flex={1}
          style={{ textDecorationLine: tachado }}
          color={color}
        >
          {p.x.concepto}
        </MText>
        <MText
          size="xl"
          weight="extraBold"
          style={{ textDecorationLine: tachado, fontVariant: ['tabular-nums'] }}
          color={color}
        >
          {formatMoney(p.x.monto)}
        </MText>
      </View>
    </>
  );
}

function Fila(p: {
  readonly x: VentaTurno;
  readonly ctx: Ctx;
  readonly onAbrir: (folio: string) => void;
}): ReactElement {
  const { x } = p;
  const cancelada = x.cancelada !== undefined;
  return (
    <Pressable
      testID={`venta-fila-${x.folio}`}
      role="button"
      aria-label={`Ver venta ${x.folio}, ${formatMoney(x.monto)}, ${x.metodo}${x.cliente ? `, ${x.cliente}` : ''}${cancelada ? ', cancelada' : ''}`}
      onPress={() => p.onAbrir(x.folio)}
      style={{
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: cancelada ? colors.gray100 : colors.white,
        borderBottomWidth: borderWidths.quiet,
        borderBottomColor: borderColors.quiet,
      }}
    >
      <Textos x={x} cancelada={cancelada} />
      <View flexDirection="row" alignItems="center" gap={8} flexWrap="wrap">
        <Chippeado {...METODO_TONO[x.metodo]} texto={x.metodo} />
        {cancelada ? (
          <Chippeado
            bg={colors.redSoft}
            fg={colors.redText}
            borde={colors.redText}
            texto="Cancelada"
          />
        ) : null}
        <MText size="xs" weight="semibold" color={colors.gray600} flex={1}>
          {detalleDe(x, p.ctx)}
        </MText>
      </View>
    </Pressable>
  );
}

/** The list, edge to edge in one quiet panel; «Sin resultados» when a filter empties it. */
export function ListaVentas(p: {
  readonly ventas: readonly VentaTurno[];
  readonly ctx: Ctx;
  readonly onAbrir: (folio: string) => void;
}): ReactElement {
  return (
    <QuietPanel testID="venta-lista" padding={0}>
      {p.ventas.map((x) => (
        <Fila key={x.folio} x={x} ctx={p.ctx} onAbrir={p.onAbrir} />
      ))}
      {p.ventas.length === 0 ? (
        <View padding={24} gap={6} alignItems="center" borderRadius={radii[2]}>
          <MText size="lg" weight="extraBold">
            Sin resultados
          </MText>
          <MText size="md" weight="semibold" color={colors.gray600} textAlign="center">
            Ninguna venta de tu turno coincide con lo que buscas.
          </MText>
        </View>
      ) : null}
    </QuietPanel>
  );
}
