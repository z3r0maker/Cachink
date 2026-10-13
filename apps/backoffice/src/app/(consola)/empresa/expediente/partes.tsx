import { CARPETAS, type Carpeta } from '@xangarro/domain/corp';
import Link from 'next/link';

import type { FilaDocumento, Historial } from '@/server/empresa/expediente-view';
import * as a from '@/styles/mostrador-agenda.css';
import * as d from '@/styles/mostrador-data.css';
import * as x from '@/styles/mostrador-expediente.css';
import * as m from '@/styles/mostrador.css';
import * as s from '@/styles/mostrador-socios.css';

import { NuevaVersionForm } from './formas';

/** The Expediente's three parts (E-05, board CD-06): folders, documents, history. */
export function Carpetas(props: {
  readonly activa: Carpeta;
  readonly conteos: ReadonlyMap<Carpeta, number>;
}) {
  return (
    <nav className={m.panel} aria-label="Carpetas">
      <ul className={x.folders}>
        {CARPETAS.map((c) => (
          <li key={c.id}>
            <Link
              className={x.folder}
              href={`/empresa/expediente?carpeta=${c.id}`}
              aria-current={c.id === props.activa ? 'page' : undefined}
            >
              <span>{c.nombre}</span>
              <span className={x.count}>{props.conteos.get(c.id) ?? 0}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className={x.note}>Nada se borra: se sube una nueva versión.</p>
    </nav>
  );
}

function Fila({ f, carpeta }: { readonly f: FilaDocumento; readonly carpeta: Carpeta }) {
  return (
    <tr className={d.rowOpen} data-testid="documento-expediente">
      <td className={d.td}>
        <Link className={d.rowLink} href={`/empresa/expediente?carpeta=${carpeta}&doc=${f.id}`}>
          {f.titulo}
        </Link>
        <span className={d.cellSub}>{f.version}</span>
      </td>
      <td className={d.td}>{f.periodo}</td>
      <td className={d.td}>{f.vinculo?.texto ?? '—'}</td>
      <td className={d.td}>{f.subido}</td>
    </tr>
  );
}

const COLUMNAS = ['Nombre', 'Periodo', 'Vinculado a', 'Subido'] as const;

export function Documentos(props: {
  readonly filas: readonly FilaDocumento[];
  readonly carpeta: Carpeta;
}) {
  if (props.filas.length === 0) {
    return (
      <section className={m.panelPad}>
        <p className={m.sub}>Esta carpeta todavía no tiene documentos.</p>
      </section>
    );
  }
  return (
    <section className={m.panel} aria-label="Documentos">
      <div className={d.tableWrap}>
        <table className={d.table}>
          <thead>
            <tr>
              {COLUMNAS.map((c) => (
                <th key={c} className={d.th} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.filas.map((f) => (
              <Fila key={f.id} f={f} carpeta={props.carpeta} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function PanelHistorial({ h }: { readonly h: Historial }) {
  return (
    <section
      className={`${m.panelPad} ${m.stack}`}
      aria-labelledby="historial"
      data-testid="historial"
    >
      <span className={m.eyebrow}>Historial</span>
      <h2 id="historial" className={s.sectionTitle}>
        {h.titulo}
      </h2>
      <div>
        {h.lineas.map((l) => (
          <div key={l.id} className={l.vigente ? `${x.version} ${x.versionCurrent}` : x.version}>
            <span>{l.texto}</span>
            <a
              className={m.boton.quieto}
              href={`/empresa/documentos/${l.id}`}
              target="_blank"
              rel="noreferrer"
            >
              Ver
            </a>
          </div>
        ))}
      </div>
      <span className={a.authority}>Se conserva hasta {h.conservaHasta} · CFF art. 30</span>
      <NuevaVersionForm documentoId={h.vigenteId} />
    </section>
  );
}
