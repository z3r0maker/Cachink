import { OperadorEstado } from '../estado';
import { NuevaVenta } from '../shell/actions';
import { ICONS, OPERADOR_BASE } from '../shell/nav';
import { PageHead, StatRow } from '../ui/panel';
import * as pc from '../ui/panel.css';
import { OpMain } from '../ui/parts';
import { EsperadoCard, PorMetodo } from './esperado';
import * as m from './mi-turno.css';
import { Movimientos } from './movimientos';
import { kpis } from './parts';
import { PendientesRecurrentes } from './pendientes';
import type { TurnoScreenProps } from './types';

/** Operador · Mi turno: the cash that must be there, today's figures, and what is due. */
export function TurnoScreen({ state, data }: TurnoScreenProps) {
  return (
    <OpMain top={24}>
      <NuevaVenta />
      <PageHead
        title="Mi turno"
        sub={
          <>
            {data.operador}, {data.caja}, desde las <span className={pc.mono}>{data.desde}</span>
          </>
        }
      />
      <div className={m.top}>
        <EsperadoCard data={data} />
        <div className={m.right}>
          <StatRow items={kpis(data)} grid={m.stats} />
          <PorMetodo items={data.porMetodo} />
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
