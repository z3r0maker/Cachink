import type { Route } from 'next';
import Link from 'next/link';

import type { Nombres } from '@/server/empresa/socios-view';
import type { FilaPlan } from '@/server/empresa/tablero-partes';
import type { VistaTablero } from '@/server/empresa/tablero-vista';
import * as i from '@/styles/mostrador-impuestos.css';
import * as s from '@/styles/mostrador-socios.css';
import * as t from '@/styles/mostrador-tablero.css';
import * as m from '@/styles/mostrador.css';

import { EnviarPlanForm } from './formas-plan';

/**
 * «El plan del 1T» (board CD-13b): each card with both partners' values and
 * the one used, while the plan is built. «Enviar el plan» sends it to the
 * other partner, who approves it in board CD-13d's drawer.
 */
function Fila({ f }: { readonly f: FilaPlan }) {
  return (
    <tr data-testid="plan-fila">
      <td className={t.celdaTexto}>
        <span className={t.tarjetaTitulo}>{f.titulo}</span>
        <br />
        <span className={t.leyenda}>{f.criterio}</span>
      </td>
      <td className={t.celdaTexto}>{f.quien}</td>
      <td className={t.celda}>{f.v1}</td>
      <td className={t.celda}>{f.v2}</td>
      <td className={t.celda}>
        <span className={f.tono === 'off' ? t.tarjetaTitulo : `${t.estado} ${i.tono[f.tono]}`}>
          {f.valor}
        </span>
      </td>
      <td className={t.celda}>
        <Link className={m.boton.quieto} href={f.href as Route}>
          Ver
        </Link>
      </td>
    </tr>
  );
}

function Tabla({
  filas,
  nombres,
}: {
  readonly filas: readonly FilaPlan[];
  readonly nombres: Nombres;
}) {
  return (
    <table className={t.tabla}>
      <thead>
        <tr>
          <th className={t.celdaTexto}>Entregable</th>
          <th className={t.celdaTexto}>Responsable</th>
          <th className={t.celda}>{nombres[1]}</th>
          <th className={t.celda}>{nombres[2]}</th>
          <th className={t.celda}>Valor</th>
          <th className={t.celda}>Tarjeta</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((f) => (
          <Fila key={f.clave} f={f} />
        ))}
      </tbody>
    </table>
  );
}

export function Plan(props: {
  readonly v: VistaTablero;
  readonly trimestre: string;
  readonly nombres: Nombres;
}) {
  const filas = props.v.plan ?? [];
  return (
    <section
      className={`${m.panelPad} ${m.stack}`}
      aria-labelledby="plan"
      data-testid="tablero-plan"
    >
      <div className={s.heroRow}>
        <span className={s.heroText}>
          <h2 id="plan" className={s.sectionTitle}>
            El plan del trimestre
          </h2>
          <span className={i.muted}>
            Cada socio pone su valor. Se usa el promedio; si difieren más del doble, la cotización
            de un tercero.
          </span>
        </span>
        {props.v.puedeEnviar ? <EnviarPlanForm trimestre={props.trimestre} /> : null}
      </div>
      {filas.length === 0 ? (
        <p className={i.muted}>Aún no hay tarjetas: agrega la primera con «+ Nueva tarjeta».</p>
      ) : (
        <Tabla filas={filas} nombres={props.nombres} />
      )}
    </section>
  );
}
