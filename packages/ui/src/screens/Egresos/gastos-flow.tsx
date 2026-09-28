/**
 * The live Gastos screen: `useGastosTurno` feeds the list, the due recurring
 * gastos sit on top, «Registrar gasto» opens the sheet (filled when paying a
 * recurring one, also from `?recurrente=<id>`), «Compra de inventario» its
 * own sheet, and each save confirms with a toast.
 */
import { useEffect, useState, type ReactElement } from 'react';
import type { IsoDate, RecurringExpense } from '@xangarro/domain';
import type { NuevoGasto, PrefillGasto } from '@xangarro/caja/gastos';
import { Toast } from '../../components/Toast/index';
import { useDescartarGastoRecurrente } from '../../hooks/use-descartar-gasto-recurrente';
import { usePendientesGastosRecurrentes } from '../../hooks/use-pendientes-gastos-recurrentes';
import { useShellData } from '../AppShell/use-shell-data';
import { CompraInventarioSheet } from './compra-inventario-sheet';
import { avisoGasto, prefillDe } from './gastos-lectura';
import { GastosScreen } from './gastos-screen';
import { PendientesCard } from './pendientes-card';
import { RegistrarGastoSheet } from './registrar-gasto-sheet';
import { useGastosTurno, useRegistrarGasto } from './use-gastos-turno';

export interface GastosFlowProps {
  /** A due recurring gasto to pay on arrival (Inicio's «Para hoy»). */
  readonly recurrenteId?: string;
}

interface Hoja {
  readonly n: number;
  readonly prefill: PrefillGasto | null;
}

function useHoja(pendientes: readonly RecurringExpense[], recurrenteId?: string) {
  const [hoja, setHoja] = useState<Hoja | null>(null);
  const [usado, setUsado] = useState(false);
  const abrir = (prefill: PrefillGasto | null): void =>
    setHoja((h) => ({ n: (h?.n ?? 0) + 1, prefill }));
  useEffect(() => {
    if (usado || recurrenteId === undefined) return;
    const r = pendientes.find((x) => x.id === recurrenteId);
    if (r === undefined) return;
    setUsado(true);
    setHoja({ n: 1, prefill: prefillDe(r) });
  }, [pendientes, recurrenteId, usado]);
  return { hoja, abrir, cerrar: () => setHoja(null) };
}

function quienDe(s: ReturnType<typeof useShellData>): string | null {
  const partes = [s.operador?.nombre ?? null, s.caja].filter((x): x is string => !!x);
  return partes.length ? partes.join(', ') : null;
}

/** The save the sheet calls, and the toast it leaves. */
function useGuardar(pendientes: readonly RecurringExpense[], cerrar: () => void) {
  const registrar = useRegistrarGasto(pendientes);
  const [toast, setToast] = useState<string | null>(null);
  const guardar = async (n: NuevoGasto): Promise<string | null> => {
    try {
      await registrar.guardar(n);
    } catch (e: unknown) {
      return `No se pudo registrar: ${e instanceof Error ? e.message : String(e)}`;
    }
    cerrar();
    setToast(avisoGasto(n));
    return null;
  };
  return { guardar, toast, setToast };
}

function Aviso(p: { readonly texto: string | null; readonly onClose: () => void }) {
  if (p.texto === null) return null;
  return <Toast title="Listo" body={p.texto} tone="ok" floating onClose={p.onClose} />;
}

function Hojas(p: {
  readonly h: ReturnType<typeof useHoja>;
  readonly g: ReturnType<typeof useGuardar>;
  readonly compra: boolean;
  readonly setCompra: (v: boolean) => void;
  readonly hoy: IsoDate;
}): ReactElement {
  const shell = useShellData();
  const { h, g } = p;
  return (
    <>
      {h.hoja ? (
        <RegistrarGastoSheet
          key={h.hoja.n}
          open
          prefill={h.hoja.prefill}
          quien={quienDe(shell)}
          onGuardar={g.guardar}
          onClose={h.cerrar}
        />
      ) : null}
      <CompraInventarioSheet
        open={p.compra}
        fecha={p.hoy}
        onClose={() => p.setCompra(false)}
        onHecho={(texto) => {
          p.setCompra(false);
          g.setToast(texto);
        }}
      />
      <Aviso texto={g.toast} onClose={() => g.setToast(null)} />
    </>
  );
}

export function GastosFlow(props: GastosFlowProps): ReactElement {
  const datos = useGastosTurno();
  const hoy = datos.hoy as IsoDate;
  const pendientes = usePendientesGastosRecurrentes(hoy).data ?? [];
  const descartar = useDescartarGastoRecurrente();
  const h = useHoja(pendientes, props.recurrenteId);
  const g = useGuardar(pendientes, h.cerrar);
  const [compra, setCompra] = useState(false);
  const tarjeta = (
    <PendientesCard
      pendientes={pendientes}
      hoy={datos.hoy}
      onRegistrar={(r) => h.abrir(prefillDe(r))}
      onDescartar={(r) => descartar.mutate({ template: r, today: hoy })}
    />
  );
  return (
    <>
      <GastosScreen
        state={datos.state}
        gastos={datos.gastos}
        conTurno={datos.conTurno}
        pendientes={tarjeta}
        onRegistrar={() => h.abrir(null)}
        onCompra={() => setCompra(true)}
        onRetry={datos.refetch}
      />
      <Hojas h={h} g={g} compra={compra} setCompra={setCompra} hoy={hoy} />
    </>
  );
}
