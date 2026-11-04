import type { Route } from 'next';
import Link from 'next/link';

import type { CuentaResultados } from '@xangarro/domain/corp';

import type { FilaEstado, MovimientoDeLinea } from '@/server/empresa/resultados-view';
import * as d from '@/styles/mostrador-data.css';
import * as r from '@/styles/mostrador-resultados.css';
import * as m from '@/styles/mostrador.css';

/**
 * The statement (E-12, board CD-07): §4's cascade against the previous
 * period. A line with an account opens into the movements behind it.
 */
export interface PropsEstado {
  readonly filas: readonly FilaEstado[];
  readonly columnas: readonly [string, string];
  readonly abierta: {
    readonly id: string;
    readonly movimientos: readonly MovimientoDeLinea[];
  } | null;
  readonly hrefDe: (cuenta: CuentaResultados | null) => string;
  readonly faltanGastos: boolean;
}

function Hijos({ movimientos }: { readonly movimientos: readonly MovimientoDeLinea[] }) {
  if (movimientos.length === 0) {
    return (
      <tr>
        <td className={`${d.td} ${r.hijo}`} colSpan={5}>
          Sin movimientos en el periodo.
        </td>
      </tr>
    );
  }
  return movimientos.map((mv, i) => (
    <tr key={`${mv.entryId}-${i}`} className={d.rowOpen} data-testid="estado-movimiento">
      <td className={`${d.td} ${r.hijo}`} colSpan={1}>
        <span className={r.fechaHijo}>{mv.fecha}</span>
        <Link className={d.rowLink} href={`/empresa/movimientos/${mv.entryId}` as Route}>
          {mv.concepto}
        </Link>
      </td>
      <td className={d.tdNum}>{mv.monto}</td>
      <td className={d.td} colSpan={3} />
    </tr>
  ));
}

function Nombre({
  f,
  abierta,
  hrefDe,
}: { readonly f: FilaEstado } & Pick<PropsEstado, 'hrefDe'> & { readonly abierta: boolean }) {
  if (f.cuenta === null)
    return <span className={f.subtotal ? r.nombreSubtotal : r.nombre}>{f.label}</span>;
  return (
    <Link
      className={r.abrir}
      href={hrefDe(abierta ? null : f.cuenta) as Route}
      aria-expanded={abierta}
    >
      {abierta ? '▾' : '▸'} {f.label}
    </Link>
  );
}

function Cabecera({ ahora, antes }: { readonly ahora: string; readonly antes: string }) {
  return (
    <thead>
      <tr>
        <th className={d.th}>Concepto</th>
        <th className={d.thNum}>{ahora}</th>
        <th className={d.thNum}>% de ingresos</th>
        <th className={d.thNum}>{antes}</th>
        <th className={d.thNum}>Cambio</th>
      </tr>
    </thead>
  );
}

function Fila(
  props: { readonly f: FilaEstado; readonly abierta: boolean } & Pick<PropsEstado, 'hrefDe'>,
) {
  const { f } = props;
  return (
    <tr className={f.subtotal ? r.subtotal : undefined} data-testid={`estado-${f.id}`}>
      <td className={d.td}>
        <Nombre f={f} abierta={props.abierta} hrefDe={props.hrefDe} />
      </td>
      <td className={`${d.tdNum} ${f.negativo ? r.negativo : ''}`}>{f.actual}</td>
      <td className={d.tdNum}>{f.pct}</td>
      <td className={d.tdNum}>{f.anterior}</td>
      <td className={`${d.tdNum} ${r.tono[f.tono]}`}>{f.cambio}</td>
    </tr>
  );
}

export function Estado(props: PropsEstado) {
  const [ahora, antes] = props.columnas;
  return (
    <section className={m.panel} aria-labelledby="estado">
      <div className={`${m.pad} ${m.stack}`}>
        <h2 id="estado" className={r.tituloPanel}>
          Estado de resultados
        </h2>
        {props.faltanGastos ? (
          <p className={r.aviso} role="note">
            Faltan gastos del periodo: sin ellos, los márgenes dicen «Sin datos».
          </p>
        ) : null}
      </div>
      <div className={d.tableWrap}>
        <table className={d.table}>
          <Cabecera ahora={ahora} antes={antes} />
          <tbody>
            {props.filas.map((f) => {
              const abierta = props.abierta?.id === f.id;
              return [
                <Fila key={f.id} f={f} abierta={abierta} hrefDe={props.hrefDe} />,
                abierta ? (
                  <Hijos key={`${f.id}-hijos`} movimientos={props.abierta?.movimientos ?? []} />
                ) : null,
              ];
            })}
          </tbody>
        </table>
      </div>
      <p className={`${m.pad} ${r.explica}`}>
        ISR estimado al 30 % sobre lo cobrado y pagado del periodo, como lo paga una persona moral
        en RESICO.
      </p>
    </section>
  );
}
