/**
 * ClienteDetailRoute — smart wrapper that reifies ClienteDetailScreen
 * + RegistrarPagoModal + the edit/eliminar mutations as a single
 * modal-overlay component routes can mount in place of an orphaned
 * onClientePress handler (Slice 9.5 T03).
 *
 * Before this landed, every mobile + desktop `ClientesRoute` passed
 * `onClientePress` as `undefined`, orphaning ClienteDetailScreen,
 * RegistrarPagoModal, useClienteDetail, useRegistrarPago,
 * useEditarCliente, and useEliminarCliente. This wrapper closes all
 * six gaps in one component and keeps the pattern in `@cachink/ui`
 * (CLAUDE.md §2.3 — one place for shared smart glue).
 *
 * Surface: the route mounts `<ClienteDetailRoute cliente={...}
 * onClose={...} />` when a cliente is tapped; the wrapper renders a
 * full-screen Modal with the detail screen inside, and a secondary
 * RegistrarPagoModal above it when the user taps "Registrar pago".
 */

import { useState, type ReactElement } from 'react';
import type {
  Client,
  ClientPayment,
  IsoDate,
  Money,
  NewClientPayment,
  Sale,
} from '@cachink/domain';
import { ZERO } from '@cachink/domain';
import { Modal } from '../../components/index';
import { useClienteDetail } from '../../hooks/use-cliente-detail';
import { useRegistrarPago } from '../../hooks/use-registrar-pago';
import { useCurrentBusinessId } from '../../app-config/index';
import { ClienteDetailScreen } from './cliente-detail-screen';
import { RegistrarPagoModal } from './registrar-pago-modal';

function todayIso(): IsoDate {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}` as IsoDate;
}

export interface ClienteDetailRouteProps {
  readonly cliente: Client | null;
  readonly onClose: () => void;
  readonly onEdit?: (cliente: Client) => void;
  readonly testID?: string;
}

function usePagoSelection(): {
  venta: Sale | null;
  saldo: bigint;
  select: (venta: Sale, saldo: bigint) => void;
  clear: () => void;
} {
  const [selection, setSelection] = useState<{ venta: Sale; saldo: bigint } | null>(null);
  return {
    venta: selection?.venta ?? null,
    saldo: selection?.saldo ?? 0n,
    select: (venta, saldo) => setSelection({ venta, saldo }),
    clear: () => setSelection(null),
  };
}

const EMPTY_PAGOS: ReadonlyMap<string, readonly ClientPayment[]> = new Map();

interface PagoSlotProps {
  readonly businessId: ReturnType<typeof useCurrentBusinessId>;
  readonly pago: ReturnType<typeof usePagoSelection>;
  readonly registrar: ReturnType<typeof useRegistrarPago>;
}

function PagoSlot(props: PagoSlotProps): ReactElement | null {
  if (!props.businessId) return null;
  return (
    <RegistrarPagoModal
      open={props.pago.venta !== null}
      onClose={props.pago.clear}
      onSubmit={(input: NewClientPayment) => {
        props.registrar.mutate(input, { onSuccess: () => props.pago.clear() });
      }}
      venta={props.pago.venta}
      saldoPendiente={props.pago.saldo as Money}
      businessId={props.businessId}
      fecha={todayIso()}
      submitting={props.registrar.isPending}
    />
  );
}

export function ClienteDetailRoute(props: ClienteDetailRouteProps): ReactElement | null {
  const businessId = useCurrentBusinessId();
  const pago = usePagoSelection();
  const detailQ = useClienteDetail(props.cliente?.id ?? null);
  const registrar = useRegistrarPago();
  const cliente = props.cliente;
  if (!cliente) return null;
  const data = detailQ.data;
  const pagosByVenta = data?.pagosByVenta ?? EMPTY_PAGOS;
  const handleRegistrarPago = (v: Sale): void => {
    const paid = (pagosByVenta.get(v.id) ?? []).reduce(
      (acc, p) => acc + (p.montoCentavos as bigint),
      0n,
    );
    pago.select(v, (v.monto as bigint) - paid);
  };
  return (
    <Modal
      open
      onClose={props.onClose}
      title={cliente.nombre}
      testID={props.testID ?? 'cliente-detail-route'}
    >
      <ClienteDetailScreen
        cliente={cliente}
        pendingSales={data?.pendingSales ?? []}
        pagosByVenta={pagosByVenta}
        saldoPendiente={data?.saldoPendiente ?? ZERO}
        onRegistrarPago={handleRegistrarPago}
        onEditar={props.onEdit ? () => props.onEdit?.(cliente) : undefined}
      />
      <PagoSlot businessId={businessId} pago={pago} registrar={registrar} />
    </Modal>
  );
}
