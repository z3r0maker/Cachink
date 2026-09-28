/**
 * The sheets and dialogs over Cobrar (Track M, M-07): the ticket, the
 * escáner, producto nuevo, «Venta hecha» and its comprobante, and the
 * «Agregaste …» notice. Underscore prefix: Expo Router ignores this file.
 */
import { useState, type ReactElement } from 'react';
import {
  ComprobanteSheet,
  EscanerSheet,
  ProductoNuevoSheet,
  TicketSheet,
  Toast,
  VentaHechaDialog,
  useCurrentBusiness,
  useVentaHecha,
  type ProductoCobrar,
} from '@xangarro/ui';
import type { InventoryCategory } from '@xangarro/domain';
import type { useCobrarRuta } from './_cobrar-hooks';

type Ruta = ReturnType<typeof useCobrarRuta>;

export interface CobrarOverlaysProps {
  readonly r: Ruta;
  readonly productos: readonly ProductoCobrar[];
  readonly tipos: readonly InventoryCategory[];
  readonly folio: string | null;
  readonly dueno: string;
}

function Hojas({ r, productos, tipos, folio, dueno }: CobrarOverlaysProps): ReactElement {
  const info = new Map(productos.map((p) => [p.id, p]));
  return (
    <>
      <TicketSheet
        open={r.hoja === 'ticket'}
        onClose={() => r.setHoja(null)}
        lines={r.ticket.lines}
        info={info}
        folio={folio}
        onBump={r.ticket.bump}
        onQuitar={r.ticket.quitar}
        onVaciar={r.ticket.vaciar}
        onCobrar={() => r.alCobro('Efectivo')}
      />
      <EscanerSheet
        open={r.hoja === 'escaner'}
        onClose={() => r.setHoja(null)}
        folio={folio}
        productos={productos}
        lines={r.ticket.lines}
        onAgregar={r.agregar}
        onQuitarUno={(p) => r.ticket.bump(p.id, -1)}
        onAlta={r.abrirNuevo}
        onCobrar={() => r.setHoja('ticket')}
      />
      <ProductoNuevoSheet
        open={r.hoja === 'nuevo'}
        onClose={() => r.setHoja(null)}
        codigo={r.codigo}
        tipos={tipos}
        dueno={dueno}
        onGuardar={(input) => r.crear.mutateAsync(input)}
        onListo={r.nuevoListo}
      />
    </>
  );
}

function VentaHechaHost({ dueno }: { dueno: string }): ReactElement {
  const venta = useVentaHecha((s) => s.venta);
  const cerrar = useVentaHecha((s) => s.cerrar);
  const business = useCurrentBusiness().data ?? null;
  const [mandar, setMandar] = useState(false);
  const nueva = (): void => {
    setMandar(false);
    cerrar();
  };
  return (
    <>
      <VentaHechaDialog
        venta={mandar ? null : venta}
        dueno={dueno}
        onMandar={() => setMandar(true)}
        onNueva={nueva}
      />
      {venta ? (
        <ComprobanteSheet
          open={mandar}
          venta={venta}
          business={business}
          onClose={() => setMandar(false)}
          onNueva={nueva}
        />
      ) : null}
    </>
  );
}

export function CobrarOverlays(p: CobrarOverlaysProps): ReactElement {
  return (
    <>
      <Hojas {...p} />
      <VentaHechaHost dueno={p.dueno} />
      {p.r.aviso.aviso ? (
        <Toast
          floating
          tone="ok"
          title={p.r.aviso.aviso}
          onClose={p.r.aviso.cerrar}
          testID="cobrar-aviso"
        />
      ) : null}
    </>
  );
}
