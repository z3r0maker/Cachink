'use client';

import { useEffect, useState } from 'react';
import { formatMoney } from '@xangarro/domain';

import { Drawer } from '@/components';
import { pagosDelEmpleado } from '@/server/actions/empleados';
import { eyebrow } from '@/styles/text.css';

import { pagoFecha, pagoMonto, pagoRow } from './empleados.css';

interface Pago {
  readonly id: string;
  readonly fecha: string;
  readonly concepto: string;
  readonly monto: bigint;
}

/**
 * P-12's employee drawer: the recent payroll payments, found through the
 * `empleado_id` link (O-26) — never by matching the gasto's «Nómina {nombre}»
 * text, which a rename breaks. Fetched when the drawer opens, because the
 * list page has no reason to carry every employee's payments.
 */
export function PagosEmpleadoDrawer({
  empleado,
  onClose,
}: {
  readonly empleado: { id: string; nombre: string; puesto: string | null } | null;
  readonly onClose: () => void;
}) {
  const [pagos, setPagos] = useState<readonly Pago[] | null>(null);

  useEffect(() => {
    if (empleado === null) return;
    setPagos(null);
    void pagosDelEmpleado(empleado.id).then((r) => setPagos(r.ok ? r.pagos : []));
  }, [empleado]);

  return (
    <Drawer
      open={empleado !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      eyebrow="Nómina"
      heading={empleado === null ? '' : `Pagos a ${empleado.nombre}`}
      description="Cada pago se registró también como un gasto, desde la caja."
    >
      {empleado === null ? null : <ListaPagos nombre={empleado.nombre} pagos={pagos} />}
    </Drawer>
  );
}

/** The three shapes the fetch can leave: reading, empty, paid. */
function ListaPagos({
  nombre,
  pagos,
}: {
  readonly nombre: string;
  readonly pagos: readonly Pago[] | null;
}) {
  if (pagos === null) return <p className={pagoFecha}>Leyendo los pagos…</p>;
  if (pagos.length === 0) {
    return (
      <p className={pagoFecha}>
        Todavía no hay pagos ligados a {nombre}. Los pagos que la caja registre con esta persona
        aparecen aquí.
      </p>
    );
  }
  return (
    <>
      <div className={eyebrow}>Pagos recientes</div>
      {pagos.map((p) => (
        <div key={p.id} className={pagoRow}>
          <span style={{ minWidth: 0 }}>
            <span style={{ fontWeight: 700, display: 'block' }}>{p.concepto}</span>
            <span className={pagoFecha}>{p.fecha}</span>
          </span>
          <span className={pagoMonto}>{formatMoney(p.monto)}</span>
        </div>
      ))}
    </>
  );
}
