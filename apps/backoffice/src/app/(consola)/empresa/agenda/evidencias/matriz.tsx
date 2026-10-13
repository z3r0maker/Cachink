import { formatMonth } from '@xangarro/domain';
import Link from 'next/link';

import type { Celda, FilaEvidencia } from '@/server/empresa/evidencias-view';
import * as a from '@/styles/mostrador-agenda.css';
import * as d from '@/styles/mostrador-data.css';
import * as m from '@/styles/mostrador.css';
import * as s from '@/styles/mostrador-socios.css';

/** Evidencias por mes (E-04, board CD-05b): each cell opens its obligation. */
const mesCorto = (mes: string) => {
  const nombre = formatMonth(mes).split(' ')[0] ?? mes;
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
};

function Contenido({ c }: { readonly c: Celda }) {
  if (c.pills.length === 0) return <span className={d.hint}>—</span>;
  return (
    <span className={a.pills}>
      {c.pills.map((p) => (
        <span key={p.texto} className={a.chip[p.tono]}>
          {p.texto}
        </span>
      ))}
    </span>
  );
}

function Fila({ f }: { readonly f: FilaEvidencia }) {
  return (
    <tr data-testid="fila-evidencia">
      <th className={a.cell} scope="row">
        <span className={a.whenDate}>{f.titulo}</span>
        <span className={a.itemBasis}>{f.prueba}</span>
      </th>
      {f.celdas.map((c) => (
        <td key={c.mes} className={a.cell}>
          {c.href === null ? (
            <Contenido c={c} />
          ) : (
            <Link
              className={a.cellLink}
              href={c.href}
              aria-label={`${f.titulo}, ${mesCorto(c.mes)}`}
            >
              <Contenido c={c} />
            </Link>
          )}
        </td>
      ))}
    </tr>
  );
}

export function Matriz({
  filas,
  meses,
}: {
  readonly filas: readonly FilaEvidencia[];
  readonly meses: readonly string[];
}) {
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="matriz">
      <h2 id="matriz" className={s.sectionTitle}>
        Evidencias por mes
      </h2>
      <p className={m.sub}>
        Una obligación no se marca presentada sin su acuse, ni pagada sin su comprobante. Toca una
        celda para ver o subir sus documentos.
      </p>
      <div className={d.tableWrap}>
        <table className={a.matrix}>
          <thead>
            <tr>
              <th className={d.th} scope="col">
                Obligación
              </th>
              {meses.map((mes) => (
                <th key={mes} className={d.th} scope="col">
                  {mesCorto(mes)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <Fila key={f.titulo} f={f} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
