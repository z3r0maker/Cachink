/**
 * A sale's sheet (MvVentas, the web caja's Detalle de venta side panel):
 * the folio, the amount, when and how it was paid, what it carried, the four
 * tiles and, while it stands, «Mandar comprobante» (M-07's share sheet) and
 * «Cancelar venta». A cancelled sale only reads, with its motive.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import { fichas, subtitulo, totalDe, type VentaDetalle } from '@xangarro/caja/ventas';
import { BottomSheet } from '../../components/BottomSheet/index';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { colors } from '../../theme';
import { MetodoEtiqueta } from './venta-fila';
import { Cancelada } from './ventas-partes';
import { Fichas, LoQueLlevo, Nota, type IconosProducto } from './venta-sheet-partes';

export interface VentaSheetProps {
  readonly venta: VentaDetalle | null;
  readonly contexto: { readonly operador: string; readonly caja: string; readonly desde: string };
  readonly iconos: IconosProducto;
  /** The line the sheet confirms a cancellation with. */
  readonly aviso: string | null;
  readonly onClose: () => void;
  readonly onComprobante: () => void;
  readonly onCancelar: () => void;
}

function Pie(p: VentaSheetProps & { readonly venta: VentaDetalle }): ReactElement {
  if (p.venta.cancelada) {
    return (
      <Btn variant="secondary" size="lg" fullWidth onPress={p.onClose} testID="venta-listo">
        Listo
      </Btn>
    );
  }
  return (
    <View gap={10}>
      <Btn
        variant="primary"
        size="xl"
        sentence
        fullWidth
        onPress={p.onComprobante}
        testID="venta-comprobante"
      >
        Mandar comprobante
      </Btn>
      <Btn variant="destructive" size="lg" fullWidth onPress={p.onCancelar} testID="venta-cancelar">
        Cancelar venta
      </Btn>
    </View>
  );
}

function Cuerpo(p: VentaSheetProps & { readonly venta: VentaDetalle }): ReactElement {
  const v = p.venta;
  return (
    <View gap={14}>
      <View flexDirection="row" alignItems="center" gap={8} flexWrap="wrap">
        <MetodoEtiqueta metodo={v.metodo} />
        {v.cancelada ? <Cancelada testID="venta-cancelada" /> : null}
        <MText size="md" weight="semibold" color={colors.gray600}>
          {subtitulo(v)}
        </MText>
      </View>
      {p.aviso ? <Nota texto={p.aviso} tono="verde" testID="venta-aviso" /> : null}
      <LoQueLlevo lineas={v.lineas} iconos={p.iconos} />
      <Fichas fichas={fichas(v, p.contexto)} />
      {v.cancelada ? (
        <Nota
          tono="rojo"
          texto={`Se canceló por: ${v.cancelada.motivo}. Ya no cuenta en tus ventas ni en tu corte.`}
        />
      ) : null}
      {v.fiado && !v.cancelada ? (
        <Nota
          tono="ambar"
          texto={`Esta venta se fue a la cuenta de ${v.fiado.cliente}. No entró dinero a tu caja.`}
        />
      ) : null}
    </View>
  );
}

export function VentaSheet(p: VentaSheetProps): ReactElement {
  const v = p.venta;
  return (
    <BottomSheet
      open={v !== null}
      onClose={p.onClose}
      eyebrow={v ? `Venta · ${v.folio}` : undefined}
      title={v ? formatMoney(totalDe(v)) : ''}
      closeLabel="Cerrar detalle"
      testID="venta-sheet"
      footer={v ? <Pie {...p} venta={v} /> : undefined}
    >
      {v ? <Cuerpo {...p} venta={v} /> : null}
    </BottomSheet>
  );
}
