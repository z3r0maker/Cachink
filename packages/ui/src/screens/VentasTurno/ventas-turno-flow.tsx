/**
 * The live Ventas tab: `useVentasTurno` feeds the list; a row opens its
 * sheet; the sheet opens M-07's comprobante or the cancel dialog, which goes
 * through `CancelarTicketUseCase` and comes back to the sheet with the
 * confirmation. One overlay at a time, as the web's `Capa`.
 */
import { useMemo, useState, type ReactElement } from 'react';
import { resolveProductIcon } from '@xangarro/domain';
import type { VentaTurno } from '@xangarro/caja/ventas';
import { useCurrentBusiness } from '../../hooks/use-current-business';
import { useProductos } from '../../hooks/use-productos';
import { PRODUCT_BG_COLORS } from '../../product-colors';
import { useShellData } from '../AppShell/use-shell-data';
import { ComprobanteSheet } from '../Checkout/comprobante-sheet';
import { useDueno } from '../Checkout/use-dueno';
import { CancelarVentaDialog } from './cancelar-venta-dialog';
import type { Motivo } from './cancelar-campos';
import { useCancelarVenta } from './use-cancelar-venta';
import { useVentasTurno } from './use-ventas-turno';
import { VentaSheet } from './venta-sheet';
import type { IconosProducto } from './venta-sheet-partes';
import type { TicketLeido } from './ventas-lectura';
import {
  avisoCancelada,
  comprobanteDe,
  detalleDeTicket,
  motivoCompleto,
  ventaDeTicket,
} from './ventas-lectura';
import { VentasTurnoScreen } from './ventas-turno-screen';

export type CapaVenta = 'sheet' | 'cancelar' | 'comprobante' | null;

export interface VentasTurnoFlowProps {
  readonly onIrAInicio: () => void;
}

function useIconos(): IconosProducto {
  const productos = useProductos().data;
  return useMemo(
    () =>
      new Map(
        (productos ?? []).map((p) => [
          p.id as string,
          {
            icono: resolveProductIcon(p.icono, p.categoria),
            tint: PRODUCT_BG_COLORS[p.colorFondo],
          },
        ]),
      ),
    [productos],
  );
}

function useCapas() {
  const [sel, setSel] = useState<string | null>(null);
  const [capa, setCapa] = useState<CapaVenta>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const abrir = (folio: string): void => {
    setSel(folio);
    setAviso(null);
    setCapa('sheet');
  };
  return { sel, capa, setCapa, aviso, setAviso, abrir, cerrar: () => setCapa(null) };
}

/** Cancel through the use case; resolves to the dialog's error, or null once done. */
function useConfirmar(fila: VentaTurno | null, c: ReturnType<typeof useCapas>) {
  const cancelar = useCancelarVenta();
  return async (m: Motivo, nip: string, nota: string): Promise<string | null> => {
    if (fila === null || fila.id === undefined) return null;
    const motivo = motivoCompleto(m, nota);
    try {
      const r = await cancelar.mutateAsync({ ticketId: fila.id, nip, motivo });
      c.setAviso(avisoCancelada(fila.folio, motivo, r.cashToReturn));
    } catch (e: unknown) {
      return `No se pudo cancelar: ${e instanceof Error ? e.message : String(e)}`;
    }
    c.setCapa('sheet');
    return null;
  };
}

function useContexto() {
  const shell = useShellData();
  return {
    desde: shell.turnoDesde,
    ctx: {
      operador: shell.operador?.nombre ?? '',
      caja: shell.caja ?? '',
      desde: shell.turnoDesde ?? '',
    },
  };
}

function Comprobante(p: {
  readonly c: ReturnType<typeof useCapas>;
  readonly leido: TicketLeido;
}): ReactElement {
  const business = useCurrentBusiness().data ?? null;
  return (
    <ComprobanteSheet
      open={p.c.capa === 'comprobante'}
      venta={comprobanteDe(p.leido)}
      business={business}
      onClose={() => p.c.setCapa('sheet')}
      onNueva={p.c.cerrar}
      listoLabel="Listo"
    />
  );
}

function Capas(p: {
  readonly c: ReturnType<typeof useCapas>;
  readonly leido: TicketLeido | null;
  readonly hoy: string;
}): ReactElement {
  const { c, leido } = p;
  const { ctx } = useContexto();
  const dueno = useDueno();
  const iconos = useIconos();
  const fila = leido === null ? null : ventaDeTicket(leido);
  const confirmar = useConfirmar(fila, c);
  return (
    <>
      <VentaSheet
        venta={c.capa === 'sheet' && leido ? detalleDeTicket(leido, p.hoy) : null}
        contexto={ctx}
        iconos={iconos}
        aviso={c.aviso}
        onClose={c.cerrar}
        onComprobante={() => c.setCapa('comprobante')}
        onCancelar={() => c.setCapa('cancelar')}
      />
      {c.capa === 'cancelar' && fila ? (
        <CancelarVentaDialog
          venta={fila}
          dueno={dueno}
          onClose={() => c.setCapa('sheet')}
          onConfirm={confirmar}
        />
      ) : null}
      {leido ? <Comprobante c={c} leido={leido} /> : null}
    </>
  );
}

export function VentasTurnoFlow(props: VentasTurnoFlowProps): ReactElement {
  const datos = useVentasTurno();
  const { desde } = useContexto();
  const c = useCapas();
  const ventas = datos.tickets.map(ventaDeTicket);
  const leido = datos.tickets.find((t) => ventaDeTicket(t).folio === c.sel) ?? null;
  return (
    <>
      <VentasTurnoScreen
        state={datos.state}
        ventas={ventas}
        desde={desde}
        abierta={c.capa === null ? null : c.sel}
        onAbrir={c.abrir}
        onRetry={datos.refetch}
        onIrAInicio={props.onIrAInicio}
      />
      <Capas c={c} leido={leido} hoy={datos.hoy} />
    </>
  );
}
