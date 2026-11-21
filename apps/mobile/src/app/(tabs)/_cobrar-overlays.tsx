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
  useLogoNegocio,
  useVentaHecha,
  type EscanerTicket,
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
}

/** The escáner on the ticket: what a code adds, «Deshacer», and the bar's «Cobrar». */
function modoTicket(r: Ruta, folio: string | null): EscanerTicket {
  return {
    tipo: 'ticket',
    folio,
    lines: r.ticket.lines,
    onAgregar: r.agregar,
    onQuitarUno: (p) => r.ticket.bump(p.id, -1),
    onCobrar: () => r.setHoja('ticket'),
  };
}

function Hojas({ r, productos, tipos, folio }: CobrarOverlaysProps): ReactElement {
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
        modo={modoTicket(r, folio)}
        productos={productos}
        onAlta={r.abrirNuevo}
      />
      <ProductoNuevoSheet
        open={r.hoja === 'nuevo'}
        onClose={() => r.setHoja(null)}
        codigo={r.codigo}
        tipos={tipos}
        onGuardar={(input) => r.crear.mutateAsync(input)}
        onListo={r.nuevoListo}
      />
    </>
  );
}

function VentaHechaHost(): ReactElement {
  const venta = useVentaHecha((s) => s.venta);
  const cerrar = useVentaHecha((s) => s.cerrar);
  const business = useCurrentBusiness().data ?? null;
  // Mounted with Cobrar, not with the sheet: the copy is refreshed while the
  // phone is online, so the comprobante has it when it is not (N-19).
  const logo = useLogoNegocio(business);
  const [mandar, setMandar] = useState(false);
  const nueva = (): void => {
    setMandar(false);
    cerrar();
  };
  return (
    <>
      <VentaHechaDialog
        venta={mandar ? null : venta}
        onMandar={() => setMandar(true)}
        onNueva={nueva}
      />
      {venta ? (
        <ComprobanteSheet
          open={mandar}
          venta={venta}
          business={business}
          logo={logo}
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
      <VentaHechaHost />
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
