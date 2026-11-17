import type { Route } from 'next';
import Link from 'next/link';

import type { FilaSocioBalance } from '@/server/empresa/balance-cuadre-view';
import * as b from '@/styles/mostrador-balance.css';
import * as d from '@/styles/mostrador-data.css';
import * as r from '@/styles/mostrador-resultados.css';
import * as m from '@/styles/mostrador.css';

const avatar = (clave: string) =>
  clave === 'F1' || clave === 'F2' || clave === 'total' ? b.avatar[clave] : b.avatar.total;

function Cabecera() {
  return (
    <thead>
      <tr>
        <th className={d.th}>Socio</th>
        <th className={d.thNum}>Capital social</th>
        <th className={d.thNum}>Aportaciones</th>
        <th className={d.thNum}>Préstamos a la empresa</th>
        <th className={d.thNum}>Total</th>
      </tr>
    </thead>
  );
}

function Fila({ f }: { readonly f: FilaSocioBalance }) {
  return (
    <tr
      className={f.clave === 'total' ? b.filaTotal : undefined}
      data-testid={`balance-socio-${f.clave}`}
    >
      <td className={d.tdStrong}>
        <span className={b.socio}>
          <span className={`${b.avatarBase} ${avatar(f.clave)}`} aria-hidden="true">
            {f.clave === 'total' ? '' : f.clave}
          </span>
          {f.nombre}
        </span>
      </td>
      <td className={d.tdNum}>{f.capital}</td>
      <td className={d.tdNum}>{f.aportaciones}</td>
      <td className={d.tdNum}>{f.prestamo}</td>
      <td className={d.tdNum}>{f.total}</td>
    </tr>
  );
}

/**
 * «Lo que pusieron los socios» (E-12, board CD-08): where the sheet's capital
 * and partner loans come from, partner by partner, to the sheet's day.
 */
export function Socios({ filas }: { readonly filas: readonly FilaSocioBalance[] }) {
  return (
    <section className={`${m.panel} ${b.lado}`} aria-labelledby="socios">
      <div className={r.encabezadoPanel}>
        <div>
          <h2 id="socios" className={r.tituloPanel}>
            Lo que pusieron los socios
          </h2>
          <p className={r.explica}>De dónde salen el capital y los préstamos del balance.</p>
        </div>
        <Link className={m.boton.secundario} href={'/empresa/socios' as Route}>
          Ver cuentas de socios
        </Link>
      </div>
      <div className={d.tableWrap}>
        <table className={d.table}>
          <Cabecera />
          <tbody>
            {filas.map((f) => (
              <Fila key={f.clave} f={f} />
            ))}
          </tbody>
        </table>
      </div>
      <p className={r.explica}>
        Las aportaciones son capital que todavía no se formaliza en acciones (aportaciones para
        futuros aumentos de capital). Los préstamos se devuelven antes de repartir utilidades.
      </p>
    </section>
  );
}
