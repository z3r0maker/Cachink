import type { DocumentoMeta } from '@xangarro/application/corp';
import Link from 'next/link';

import { fechaCorta } from '@/server/empresa/fechas';
import * as a from '@/styles/mostrador-agenda.css';
import * as m from '@/styles/mostrador.css';

/**
 * A short list of kept documents (E-04, E-05), on an obligation or a
 * movement: when, what, and «Historial» and «Ver» as buttons.
 */
export function ListaDocumentos(props: {
  readonly docs: readonly DocumentoMeta[];
  readonly vacio: string;
  readonly detalle: (d: DocumentoMeta) => string;
}) {
  if (props.docs.length === 0) return <p className={m.sub}>{props.vacio}</p>;
  return (
    <ul className={a.list}>
      {props.docs.map((d) => (
        <li key={d.id} className={a.item} data-testid="documento">
          <span className={a.whenDate}>{fechaCorta(d.subidoEn.slice(0, 10))}</span>
          <span>
            <span className={a.whenDate}>{d.nombre}</span>
            <span className={a.itemBasis}>{props.detalle(d)}</span>
          </span>
          <span className={m.row}>
            <Link
              className={m.boton.quieto}
              href={`/empresa/expediente?carpeta=${d.carpeta}&doc=${d.id}`}
            >
              Historial
            </Link>
            <a
              className={m.boton.secundario}
              href={`/empresa/documentos/${d.id}`}
              target="_blank"
              rel="noreferrer"
            >
              Ver
            </a>
          </span>
        </li>
      ))}
    </ul>
  );
}
