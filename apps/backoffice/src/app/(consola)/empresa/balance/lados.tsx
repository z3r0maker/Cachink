import type { Route } from 'next';
import Link from 'next/link';

import type { DatosBalance } from '@/server/empresa/balance-lectura';
import type { CuentaVista, GrupoVista } from '@/server/empresa/balance-view';
import * as b from '@/styles/mostrador-balance.css';
import * as m from '@/styles/mostrador.css';

/**
 * The sheet's two sides (E-12, board CD-08): Activo, then Pasivo and Capital,
 * each account against the previous month's last day. An account opens into
 * its month of movements; the year's result opens Resultados.
 */
type Abiertos = DatosBalance['abiertos'];

function Movimientos({ lista }: { readonly lista: NonNullable<Abiertos> }) {
  if (lista.length === 0) {
    return (
      <ul className={b.movimientos}>
        <li className={b.nota}>Sin movimientos en el mes.</li>
      </ul>
    );
  }
  return (
    <ul className={b.movimientos}>
      {lista.map((mv, i) => (
        <li key={`${mv.entryId}-${i}`} className={b.movimiento} data-testid="balance-movimiento">
          <Link href={`/empresa/movimientos/${mv.entryId}` as Route}>
            {mv.fecha} · {mv.concepto}
          </Link>
          <span className={b.num.actual}>{mv.monto}</span>
          <span />
        </li>
      ))}
    </ul>
  );
}

function Cuenta({ c, abiertos }: { readonly c: CuentaVista; readonly abiertos: Abiertos }) {
  return (
    <>
      <Link
        className={b.cuenta}
        href={c.href as Route}
        aria-expanded={c.id === 'resultado' ? undefined : c.abierta}
        data-testid={`balance-cuenta-${c.id}`}
      >
        <span className={b.cuentaNombre}>
          <span className={b.nombre}>{c.nombre}</span>
          <span className={b.nota}>{c.nota}</span>
        </span>
        <span className={c.negativo ? b.num.negativo : b.num.actual}>{c.actual}</span>
        <span className={b.num.anterior}>{c.anterior}</span>
      </Link>
      {c.abierta && abiertos !== null ? <Movimientos lista={abiertos} /> : null}
    </>
  );
}

function Grupo(props: {
  readonly g: GrupoVista;
  readonly columnas: readonly [string, string];
  readonly abiertos: Abiertos;
}) {
  const { g, columnas } = props;
  return (
    <div>
      <div className={b.grupoCabeza}>
        <h2 className={b.grupoTitulo}>{g.nombre}</h2>
        <span className={b.columna}>{columnas[0]}</span>
        <span className={b.columna}>{columnas[1]}</span>
      </div>
      {g.cuentas.map((c) => (
        <Cuenta key={c.id} c={c} abiertos={props.abiertos} />
      ))}
      <div className={b.total} data-testid={`balance-total-${g.nombre.toLowerCase()}`}>
        <span>{g.totalNombre}</span>
        <span className={b.num.actual}>{g.total}</span>
        <span className={b.num.anterior}>{g.totalAnterior}</span>
      </div>
    </div>
  );
}

export function Lados(props: {
  readonly lados: readonly (readonly GrupoVista[])[];
  readonly columnas: readonly [string, string];
  readonly abiertos: Abiertos;
}) {
  return (
    <div className={b.lados}>
      {props.lados.map((grupos, i) => (
        <section key={i} className={`${m.panel} ${b.lado}`}>
          {grupos.map((g) => (
            <Grupo key={g.nombre} g={g} columnas={props.columnas} abiertos={props.abiertos} />
          ))}
        </section>
      ))}
    </div>
  );
}
