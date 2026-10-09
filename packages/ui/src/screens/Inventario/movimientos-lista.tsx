/**
 * «Movimientos de mi turno» (M-09): one quiet panel of rows, oldest first
 * as the ledger appends them — the kind's arrow on the kind's tint, the
 * product, the note under it, the kind's pill, the signed amount in the
 * kind's colour and the time. The board has no empty answer for this tab;
 * the phone says one so the list never shows nothing.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { delta, type Existencia, type Movimiento } from '@xangarro/caja/inventario';
import { MText } from '../../components/Mostrador/index';
import { QuietPanel } from '../../components/Panel/index';
import { borderWidths, colors } from '../../theme';
import { EtiquetaTipo } from './mover-botones';
import { TipoTile } from './mover-glifos';

function Fila(p: { readonly m: Movimiento; readonly it: Existencia | undefined }): ReactElement {
  const entrada = p.m.tipo === 'Entrada';
  return (
    <View flexDirection="row" alignItems="center" gap={14} paddingVertical={12}>
      <TipoTile tipo={p.m.tipo} />
      <View flex={1} gap={2}>
        <MText size="md" weight="extraBold" letterSpacing={-0.2}>
          {p.it?.nombre ?? ''}
        </MText>
        <MText size="xs" weight="semibold" color={colors.gray600}>
          {p.m.detalle}
        </MText>
      </View>
      <EtiquetaTipo tipo={p.m.tipo} />
      <MText
        size="lg"
        weight="extraBold"
        letterSpacing={-0.3}
        fontVariant={['tabular-nums']}
        color={entrada ? colors.greenText : colors.redText}
        testID={`inventario-mov-delta-${p.m.id}`}
      >
        {delta(p.m, p.it?.unidad ?? '')}
      </MText>
      <MText
        size="sm"
        weight="bold"
        fontVariant={['tabular-nums']}
        color={colors.gray600}
        testID={`inventario-mov-hora-${p.m.id}`}
      >
        {p.m.hora}
      </MText>
    </View>
  );
}

export function MovimientosLista(p: {
  readonly movs: readonly Movimiento[];
  readonly items: readonly Existencia[];
}): ReactElement {
  return (
    <QuietPanel
      label="Movimientos de mi turno"
      count={p.movs.length}
      testID="inventario-movimientos"
    >
      {p.movs.map((m, i) => (
        <View
          key={m.id}
          borderTopWidth={i === 0 ? 0 : borderWidths.quiet}
          borderTopColor={colors.gray100}
          paddingHorizontal={14}
        >
          <Fila m={m} it={p.items.find((it) => it.id === m.existenciaId)} />
        </View>
      ))}
      {p.movs.length === 0 ? (
        <View paddingHorizontal={14} paddingVertical={26} alignItems="center">
          <MText size="md" weight="bold" color={colors.gray600} textAlign="center">
            Todavía no registras entradas ni mermas en este turno.
          </MText>
        </View>
      ) : null}
    </QuietPanel>
  );
}
