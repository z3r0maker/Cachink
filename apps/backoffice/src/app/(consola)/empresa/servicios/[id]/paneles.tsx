import type { CategoriaGasto } from '@xangarro/domain/corp';
import type { Route } from 'next';
import Link from 'next/link';

import type { GastoRegistrado, KpiServicio } from '@/server/empresa/servicio-detalle-view';
import type { PanelRecurrente } from '@/server/empresa/servicio-recurrente-view';
import type { Grafica } from '@/server/empresa/servicios-uso-view';
import * as d from '@/styles/mostrador-data.css';
import * as r from '@/styles/mostrador-resultados.css';
import * as s from '@/styles/mostrador-servicios.css';
import * as m from '@/styles/mostrador.css';

import { Barras } from '../barras';

/** A service's page (E-24, board CD-18c), its panels. Presentational. */
export function Kpis({ kpis }: { readonly kpis: readonly KpiServicio[] }) {
  return (
    <section className={m.tiles} aria-label="Cifras del servicio">
      {kpis.map((k) => (
        <div
          key={k.label}
          className={`${m.panelPad} ${k.aviso ? s.tileAviso : ''}`}
          data-testid="servicio-kpi"
        >
          <span className={m.tileLabel}>{k.label}</span>
          <span className={m.tileValue}>{k.valor}</span>
          <span className={m.tileNote}>{k.nota}</span>
        </div>
      ))}
    </section>
  );
}

export function CostoDeCadaMes(props: {
  readonly grafica: Grafica;
  readonly categoria: CategoriaGasto;
  readonly aviso: string | null;
  readonly nota: string;
  readonly pasa: boolean;
}) {
  return (
    <section className={`${m.panelPad} ${m.stack} ${s.destacado}`} aria-labelledby="meses">
      <div className={m.row}>
        <h2 id="meses" className={r.titular}>
          Costo de cada mes
        </h2>
        {props.aviso === null ? null : (
          <span className={s.nota}>Aviso: {props.aviso}, la línea punteada</span>
        )}
      </div>
      <Barras
        barras={props.grafica.barras}
        categoria={props.categoria}
        aviso={props.grafica.aviso}
        grande
      />
      <p className={props.pasa ? s.notaAviso : s.nota}>{props.nota}</p>
    </section>
  );
}

export function Gastos({
  gastos,
  comision,
}: {
  readonly gastos: readonly GastoRegistrado[];
  readonly comision: boolean;
}) {
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="gastos">
      <h2 id="gastos" className={r.titular}>
        Gastos registrados
      </h2>
      {gastos.length === 0 ? (
        <p className={d.empty}>
          {comision
            ? 'Las comisiones salen de cada depósito de Stripe, en Movimientos.'
            : 'Todavía no hay gastos registrados de este servicio.'}
        </p>
      ) : (
        <div>
          {gastos.map((g) => (
            <Link
              key={g.href}
              className={s.gasto}
              href={g.href as Route}
              data-testid="servicio-gasto"
            >
              <span className={s.para}>{g.fecha}</span>
              <span>{g.concepto}</span>
              <span>{g.monto}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function SuRecurrente({ p }: { readonly p: PanelRecurrente }) {
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="recurrente">
      <h2 id="recurrente" className={r.titular}>
        Su gasto recurrente
      </h2>
      <div className={s.plantilla} data-testid="servicio-recurrente">
        <span className={s.nombre}>{p.titulo}</span>
        <span className={s.para}>{p.texto}</span>
        {p.proximo === null ? null : <span className={s.resumen}>{p.proximo}</span>}
      </div>
      {p.activa ? (
        <>
          <Link
            className={m.boton.secundario}
            href={'/empresa/movimientos?ver=recurrentes' as Route}
          >
            Ver en Recurrentes
          </Link>
          <p className={s.nota}>
            Dar de baja el servicio detiene su gasto recurrente. Los gastos ya registrados se
            quedan.
          </p>
        </>
      ) : null}
    </section>
  );
}
