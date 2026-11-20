/**
 * «Escanea el producto» (MvEscaner, EcInventario): the camera in a bottom
 * sheet, the torch, typing the code by hand, and what each code did. On the
 * ticket a known code goes on it with «Deshacer»; in Inventario it closes the
 * escáner and opens that product's movement. An unknown code offers «Darlo de
 * alta», which opens Producto nuevo with the code filled in.
 */
import { useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { LineaTicket } from '@xangarro/caja/caja';
import { BottomSheet } from '../../components/BottomSheet/index';
import { MText } from '../../components/Mostrador/index';
import { CobrarBar } from './cobrar-bar';
import type { ProductoCobrar } from './cobrar-catalogo';
import { EscanerCamara } from './escaner-camara';
import { Controles, Manual } from './escaner-controles';
import { EscanerResultado } from './escaner-resultado';
import { resumenTicket } from './ticket-en-curso';
import { useEscaner, type ModoEscaner } from './use-escaner';

/** Cobrar's escáner: the ticket's lines and its «Cobrar» bar. */
export interface EscanerTicket {
  readonly tipo: 'ticket';
  readonly folio: string | null;
  readonly lines: readonly LineaTicket[];
  readonly onAgregar: (p: ProductoCobrar) => void;
  readonly onQuitarUno: (p: ProductoCobrar) => void;
  /** The bar's «Cobrar»: on to the ticket. */
  readonly onCobrar: () => void;
}

/** Inventario's escáner: one product at a time, onto its movement. */
export interface EscanerProducto {
  readonly tipo: 'producto';
  readonly llevaExistencias: (p: ProductoCobrar) => boolean;
  readonly onProducto: (p: ProductoCobrar) => void;
}

export interface EscanerSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly modo: EscanerTicket | EscanerProducto;
  readonly productos: readonly ProductoCobrar[];
  /** «Darlo de alta»: Producto nuevo with this code. */
  readonly onAlta: (codigo: string) => void;
  /** «Pedro», or «el dueño»: who sees a shared code, who decides what keeps stock. */
  readonly dueno: string;
}

/** `apagar` runs before Inventario's product closes the escáner, as any way out does. */
function modoDelHook(m: EscanerTicket | EscanerProducto, apagar: () => void): ModoEscaner {
  if (m.tipo === 'ticket') {
    return { tipo: 'ticket', onAgregar: m.onAgregar, onQuitarUno: m.onQuitarUno };
  }
  const onProducto = (p: ProductoCobrar): void => {
    apagar();
    m.onProducto(p);
  };
  return { tipo: 'producto', llevaExistencias: m.llevaExistencias, onProducto };
}

function useEscanerSheet(p: EscanerSheetProps) {
  const [luz, setLuz] = useState(false);
  const [manual, setManual] = useState(false);
  // Every way out leaves the next opening fresh: no old card, torch off, and
  // the camera rather than a typed field still holding the last code.
  const apagar = (): void => {
    setLuz(false);
    setManual(false);
  };
  const e = useEscaner(p.productos, modoDelHook(p.modo, apagar));
  const salir = (then: () => void) => (): void => {
    e.reiniciar();
    apagar();
    then();
  };
  return { e, luz, setLuz, manual, setManual, salir };
}

function Pie(p: { modo: EscanerTicket; onCobrar: () => void }): ReactElement {
  const { piezas, total } = resumenTicket(p.modo.lines);
  return <CobrarBar piezas={piezas} total={total} onCobrar={p.onCobrar} enHoja />;
}

const eyebrowDe = (m: EscanerTicket | EscanerProducto): string =>
  m.tipo === 'ticket' ? ['Escáner', m.folio].filter(Boolean).join(' · ') : 'Escáner · Inventario';

/** The camera waits while a card asks something of the operator. */
const PAUSAN: readonly string[] = ['desconocido', 'duplicado', 'sinExistencias'];

export function EscanerSheet(p: EscanerSheetProps): ReactElement {
  const { e, luz, setLuz, manual, setManual, salir } = useEscanerSheet(p);
  const pie =
    p.modo.tipo === 'ticket' ? <Pie modo={p.modo} onCobrar={salir(p.modo.onCobrar)} /> : null;
  return (
    <BottomSheet
      open={p.open}
      onClose={salir(p.onClose)}
      eyebrow={eyebrowDe(p.modo)}
      title="Escanea el producto"
      closeLabel="Cerrar el escáner"
      testID="escaner-sheet"
      {...(pie ? { footer: pie } : {})}
    >
      <View gap={12}>
        <EscanerCamara
          luz={luz}
          activo={p.open && !PAUSAN.includes(e.estado.tipo)}
          onCodigo={e.leer}
        />
        <MText weight="bold" textAlign="center">
          Apunta al código de barras
        </MText>
        {manual ? <Manual onBuscar={e.leer} /> : null}
        <Controles
          luz={luz}
          onLuz={() => setLuz(!luz)}
          manual={manual}
          onManual={() => setManual(!manual)}
        />
        <EscanerResultado
          e={e}
          dueno={p.dueno}
          inventario={p.modo.tipo === 'producto'}
          onAlta={(c) => salir(() => p.onAlta(c))()}
        />
      </View>
    </BottomSheet>
  );
}
