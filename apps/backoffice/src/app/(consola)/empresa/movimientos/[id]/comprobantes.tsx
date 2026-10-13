import type { DocumentoMeta } from '@xangarro/application/corp';
import type { Movimiento } from '@xangarro/data-corp';

import * as m from '@/styles/mostrador.css';
import * as s from '@/styles/mostrador-socios.css';

import { AdjuntarForm } from '../../expediente/formas';
import { ListaDocumentos } from '../../lista-documentos';

/**
 * A movement's proofs (E-05): its factura or the statement line, kept in the
 * Expediente's «Comprobantes» folder and linked to this entry.
 */
export function Comprobantes(props: {
  readonly mov: Movimiento;
  readonly docs: readonly DocumentoMeta[];
}) {
  const { mov } = props;
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="comprobantes">
      <h2 id="comprobantes" className={s.sectionTitle}>
        Comprobantes
      </h2>
      <ListaDocumentos
        docs={props.docs}
        vacio="Sin comprobante todavía: adjunta la factura o el estado de cuenta."
        detalle={(d) => d.titulo}
      />
      <AdjuntarForm
        entryId={mov.id}
        titulo={`Comprobante · ${mov.concepto}`}
        periodo={mov.fecha.slice(0, 7)}
      />
    </section>
  );
}
