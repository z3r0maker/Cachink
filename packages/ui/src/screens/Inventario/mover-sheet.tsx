/**
 * «¿Qué pasó con la mercancía?» (RvInventario; M9, item 6): the one sheet a
 * row opens, on that product, with the kind its stock calls for already
 * chosen — «Llegó mercancía» or «Se echó a perder». The quantity is typed or
 * stepped; a merma never takes more than there is and always says what
 * happened. Saving goes through the route's write and the sheet closes; the
 * screen's toast is the confirmation. Mounted fresh on every opening.
 */
import { useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import {
  conUnidad,
  type Existencia,
  type NuevoMovimientoVivo,
  type TipoMovimiento,
} from '@xangarro/caja/inventario';
import { BottomSheet } from '../../components/BottomSheet/index';
import { Cantidad } from './mover-cantidad';
import { Articulo, Motivos } from './mover-campos-registro';
import {
  borradorInicial,
  cta,
  limpio,
  listo,
  paso,
  payload,
  quedan,
  type Borrador,
} from './mover-logica';
import { NotaFirma, PieMover } from './mover-pie';
import { Tipos } from './mover-tipos';
import { useGuardarHoja } from './use-mover-form';

export interface MovimientoSheetProps {
  /** The product the row was. */
  readonly item: Existencia;
  /** The kind the sheet opens on (`tipoAlAbrir`, or Entrada for «Reponer»). */
  readonly tipo: TipoMovimiento;
  /** «Ana Robledo, Caja 1», from the session. */
  readonly firma: string;
  /** Opened by the escáner (M-20): the product says «Del escáner». */
  readonly delEscaner?: boolean;
  readonly onClose: () => void;
  readonly onGuardar: (m: NuevoMovimientoVivo) => Promise<void>;
}

/** The unit as the field says it, «kg», «litros», «piezas». */
const unidadDe = (e: Existencia, raw: string): string =>
  conUnidad(Number(raw) || 2, e.unidad).replace(/^\S+ /, '');

function Campos(p: {
  readonly b: Borrador;
  readonly e: Existencia;
  readonly delEscaner: boolean;
  readonly set: (b: Borrador) => void;
}): ReactElement {
  const { b, e, set } = p;
  const merma = b.tipo === 'Merma';
  return (
    <View gap={16}>
      <Tipos value={b.tipo} onChange={(tipo) => set(borradorInicial(tipo))} />
      <Articulo e={e} delEscaner={p.delEscaner} />
      <Cantidad
        label={merma ? '¿Cuánto se echó a perder?' : '¿Cuánto llegó?'}
        raw={b.raw}
        unidad={unidadDe(e, b.raw)}
        quedan={quedan(b, e)}
        onRaw={(v) => set({ ...b, raw: limpio(v) })}
        onPaso={(d) => set({ ...b, raw: paso(b, e, d) })}
      />
      {merma ? <Motivos value={b.motivo} onChange={(motivo) => set({ ...b, motivo })} /> : null}
    </View>
  );
}

export function MovimientoSheet(p: MovimientoSheetProps): ReactElement {
  const [b, set] = useState<Borrador>(() => borradorInicial(p.tipo));
  const { guardando, error, guardar } = useGuardarHoja(p.onGuardar, p.onClose);
  return (
    <BottomSheet
      open
      onClose={p.onClose}
      eyebrow="Movimiento de inventario"
      title="¿Qué pasó con la mercancía?"
      closeLabel="Cerrar sin registrar"
      testID="mover-sheet"
      footer={
        <PieMover
          cta={cta(b, p.item)}
          listo={listo(b, p.item)}
          guardando={guardando}
          error={error}
          onCancelar={p.onClose}
          onGuardar={() => void guardar(payload(b, p.item))}
        />
      }
    >
      <View gap={18}>
        <Campos b={b} e={p.item} delEscaner={p.delEscaner ?? false} set={set} />
        <NotaFirma firma={p.firma} />
      </View>
    </BottomSheet>
  );
}
