import { formatMoneyEntero } from '@xangarro/domain';
import { trimestreDe, type CostoDeSudor } from '@xangarro/domain/corp';
import type { Route } from 'next';
import Link from 'next/link';

import type { VistaResultados } from '@/server/empresa/resultados-view';
import { hrefTablero } from '@/server/empresa/tablero-view';
import * as r from '@/styles/mostrador-resultados.css';
import * as m from '@/styles/mostrador.css';

/**
 * «Costo de sudor» (E-12, board CD-07): the partners' unpaid work, the value
 * the Tablero accepted for cards finished in the period, and the EBITDA the
 * company would have if it paid for it. The same under Devengado and Flujo.
 */
const dinero = (v: bigint): string =>
  v < 0n ? `(${formatMoneyEntero(-v)})` : formatMoneyEntero(v);

export function Sudor(props: {
  readonly v: VistaResultados;
  readonly sudor: CostoDeSudor;
  readonly ebitda: bigint;
}) {
  const { sudor } = props;
  const economico = dinero(props.ebitda - sudor.valor);
  const titulo =
    sudor.tarjetas === 0
      ? `Sin trabajo de socios aceptado en el Tablero en el periodo · EBITDA económico: ${economico}`
      : `Costo de sudor: ${dinero(sudor.valor)} · EBITDA económico: ${economico}`;
  return (
    <section className={r.sudor} aria-label="Costo de sudor" data-testid="costo-sudor">
      <span>
        <span className={r.sudorTitulo}>{titulo}</span>
        <span className={r.sudorNota}>
          Cuánto ganaría la empresa si pagara el trabajo de sus socios, según el valor aceptado en
          el Tablero por lo que se terminó en el periodo.
        </span>
      </span>
      <Link
        className={m.boton.secundario}
        href={hrefTablero(trimestreDe(props.v.periodo.hasta)) as Route}
      >
        Ver Tablero
      </Link>
    </section>
  );
}
