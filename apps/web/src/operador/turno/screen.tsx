import Link from 'next/link';
import { formatMoney } from '@xangarro/domain';

import { OperadorEstado } from '../estado';
import { NuevaVenta } from '../shell/actions';
import { ICONS, OPERADOR_BASE } from '../shell/nav';
import { KpiRow, OpMain } from '../ui/parts';
import * as t from '../ui/title.css';
import { desglose } from './desglose';
import { Movimientos } from './movimientos';
import { Atajos, kpis } from './parts';
import { PendientesRecurrentes } from './pendientes';
import * as s from './turno.css';
import type { TurnoData, TurnoScreenProps } from './types';

/** Operador · Turno: the expected cash, today's figures, and every movement. */
export function TurnoScreen({ state, data }: TurnoScreenProps) {
  return (
    <OpMain top={22}>
      <NuevaVenta />
      <div className={t.titleRow}>
        <h1 className={t.pageTitle}>Tu turno</h1>
        <span className={t.pageSub}>
          {data.operador} · {data.caja} · abierto desde las {data.desde}
        </span>
      </div>
      <div className={s.top}>
        <EsperadoCard data={data} />
        <div className={s.right}>
          <KpiRow items={kpis(data)} min={200} valueSize={28} />
          <Atajos />
        </div>
      </div>
      <PendientesRecurrentes items={data.pendientes} />
      {state === 'happy' ? (
        <Movimientos items={data.movimientos} />
      ) : (
        <OperadorEstado
          mode={state}
          icon={ICONS.turno}
          emptyTitle="Tu turno va en blanco"
          emptyBody="Todavía no has capturado nada. En cuanto cobres la primera venta, aparece aquí."
          errorTitle="No pudimos cargar los movimientos de tu turno"
          cta="Ir a la caja"
          href={`${OPERADOR_BASE}/caja`}
        />
      )}
    </OpMain>
  );
}

function EsperadoCard({ data }: { readonly data: TurnoData }) {
  const rows = desglose(data);
  return (
    <div className={s.hero}>
      <div className={s.heroLabel}>Efectivo esperado en caja</div>
      <div className={s.heroAmount}>{formatMoney(data.esperado)}</div>
      <div className={s.breakdown}>
        {rows.map(([label, value]) => (
          <div key={label} className={s.breakdownRow}>
            <span className={s.breakdownLabel}>{label}</span>
            <span className={s.breakdownValue}>{value}</span>
          </div>
        ))}
      </div>
      <Link href={`${OPERADOR_BASE}/cierre`} className={s.heroCta} data-onyellow="">
        Cerrar turno
      </Link>
    </div>
  );
}
