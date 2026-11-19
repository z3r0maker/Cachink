import type { Route } from 'next';
import Link from 'next/link';

import { nombreMes, fechaLarga } from '@/server/empresa/fechas';
import { hrefImpuestos, venceEl, type DatosImpuestos } from '@/server/empresa/impuestos-view';
import { mesesAnteriores } from '@/server/empresa/impuestos-papeles';
import * as c from '@/styles/mostrador-impuestos-tarjetas.css';
import * as i from '@/styles/mostrador-impuestos.css';
import * as r from '@/styles/mostrador-resultados.css';
import * as m from '@/styles/mostrador.css';

/** The year's earlier months, one line each (board CD-09); each opens its own. */
export function Anteriores({ d }: { readonly d: DatosImpuestos }) {
  const meses = mesesAnteriores(d);
  if (meses.length === 0) return null;
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="anteriores">
      <h2 id="anteriores" className={r.titular}>
        Meses anteriores de {d.mes.slice(0, 4)}
      </h2>
      <div>
        {meses.map((x) => (
          <Link key={x.mes} href={x.href as Route} className={i.mesFila} data-testid="mes-anterior">
            <span className={i.pasoTitulo}>{x.nombre}</span>
            <span className={i.muted}>{x.detalle}</span>
            <span className={c.valor}>{x.total}</span>
            <span className={`${i.chipBase} ${i.tono[x.chip.tono]}`}>{x.chip.texto}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** A month with nothing collected, paid or declared: it is still declared, en ceros. */
export function SinMovimientos({ mes }: { readonly mes: string }) {
  return (
    <section className={`${m.hero} ${m.stack}`} aria-labelledby="vacio">
      <span className={m.eyebrow}>Impuestos de {nombreMes(mes)}</span>
      <h2 id="vacio" className={r.titular}>
        Aún no hay movimientos en {nombreMes(mes)}
      </h2>
      <p className={i.muted}>
        Sin cobros ni gastos pagados, el ISR, el IVA y las retenciones dan $0.00. La declaración se
        presenta igual, en ceros, a más tardar el {fechaLarga(venceEl(mes))}.
      </p>
      <div className={m.row}>
        <Link className={m.boton.primario} href={hrefImpuestos(mes, true) as Route} scroll={false}>
          Capturar la declaración
        </Link>
      </div>
    </section>
  );
}
