/**
 * The sale sheet over the list (MvVentas «detalle»; the web's side drawer as
 * a bottom sheet, per the Track M decision): the folio, where the sale
 * stands, the total big, what it carried, the four tiles, the cancelled or
 * fiado note, and «Mandar comprobante» / «Cancelar venta» — once cancelled,
 * only «Listo».
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { formatMoney } from '@xangarro/domain';
import {
  estadoDe,
  ESTADO_ENVIO,
  subtitulo,
  totalDe,
  type CargaTicket,
  type VentaDetalle,
} from '@xangarro/caja/ventas';
import { BottomSheet } from '../../components/BottomSheet/index';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { Eyebrow } from '../../components/Panel/index';
import { PathIcon } from '../../components/PathIcon/index';
import { colors, radii } from '../../theme';
import { COBRAR_GLYPHS } from './cobrar-glyphs';
import { FichaTiles, Linea, Nota, Pill } from './venta-detalle-partes';

export interface VentaDetalleSheetProps {
  readonly open: boolean;
  readonly folio: string;
  readonly carga: CargaTicket;
  readonly ctx: { readonly operador: string; readonly caja: string; readonly desde: string };
  /** What a cancellation made on this screen just did. */
  readonly aviso: string | null;
  /** False until the turno's list has this sale. */
  readonly cancelable: boolean;
  readonly onClose: () => void;
  readonly onCompartir: (venta: VentaDetalle) => void;
  readonly onCancelar: () => void;
  /** The fiado note's way to collect (M-08's Fiado y abonos owns it). */
  readonly onAbono?: () => void;
}

const SIN: Readonly<Record<'loading' | 'empty' | 'error', readonly [string, string]>> = {
  loading: ['Cargando el ticket…', 'Un momento, lo estamos leyendo de la caja.'],
  empty: [
    'Esta venta ya no existe',
    'Puede que se haya cancelado desde otra caja. Vuelve a la lista de ventas de tu turno.',
  ],
  error: ['No pudimos cargar el ticket', 'Cierra y vuelve a abrir la venta en un momento.'],
};

function Pie(p: VentaDetalleSheetProps & { readonly venta: VentaDetalle }): ReactElement {
  if (p.venta.cancelada) {
    return (
      <Btn variant="secondary" size="xl" fullWidth onPress={p.onClose} testID="venta-detalle-listo">
        Listo
      </Btn>
    );
  }
  return (
    <View gap={8}>
      <Btn
        variant="primary"
        size="xl"
        sentence
        fullWidth
        icon={<PathIcon d={COBRAR_GLYPHS.whatsapp} size={18} strokeWidth={2.2} />}
        onPress={() => p.onCompartir(p.venta)}
        testID="venta-detalle-compartir"
      >
        Mandar comprobante
      </Btn>
      <Btn
        variant="danger"
        size="xl"
        fullWidth
        disabled={!p.cancelable}
        onPress={p.onCancelar}
        testID="venta-detalle-cancelar"
      >
        Cancelar venta
      </Btn>
    </View>
  );
}

/** The ticket's body: when, where it stands, what it carried, the tiles, the note. */
function Cuerpo(p: VentaDetalleSheetProps & { readonly venta: VentaDetalle }): ReactElement {
  return (
    <View gap={12} paddingBottom={4}>
      <View
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        gap={10}
        flexWrap="wrap"
      >
        <MText size="sm" weight="semibold" color={colors.gray600} flex={1}>
          {subtitulo(p.venta)}
        </MText>
        <Pill {...ESTADO_ENVIO[estadoDe(p.venta)]} />
      </View>
      {p.aviso ? (
        <View
          padding={12}
          borderRadius={radii[3]}
          backgroundColor={colors.greenSoft}
          role="status"
          testID="venta-detalle-aviso"
        >
          <MText size="sm" weight="bold" color={colors.greenText}>
            {p.aviso}
          </MText>
        </View>
      ) : null}
      <View gap={2}>
        <Eyebrow>Lo que llevó</Eyebrow>
        {p.venta.lineas.map((l) => (
          <Linea key={l.productoId} l={l} />
        ))}
      </View>
      <FichaTiles venta={p.venta} ctx={p.ctx} />
      <Nota venta={p.venta} onAbono={p.onAbono} />
    </View>
  );
}

export function VentaDetalleSheet(p: VentaDetalleSheetProps): ReactElement {
  const venta = p.carga.state === 'happy' ? p.carga.venta : null;
  const sin = p.carga.state === 'happy' ? null : SIN[p.carga.state];
  return (
    <BottomSheet
      open={p.open}
      onClose={p.onClose}
      eyebrow={`Venta · ${p.folio}`}
      title={venta ? formatMoney(totalDe(venta)) : (sin?.[0] ?? p.folio)}
      closeLabel="Cerrar la venta"
      testID="venta-detalle"
      footer={venta ? <Pie {...p} venta={venta} /> : undefined}
    >
      {venta ? (
        <Cuerpo {...p} venta={venta} />
      ) : (
        <MText size="md" weight="semibold" color={colors.gray600}>
          {sin?.[1]}
        </MText>
      )}
    </BottomSheet>
  );
}
