import type { Autonomia } from '@xangarro/domain/corp';
import type { Route } from 'next';
import Link from 'next/link';

import { pagosDe } from '@/server/empresa/caja-pagos';
import { flujoDe, fondeoDe, prestamosDe } from '@/server/empresa/caja-paneles';
import type { DatosCaja } from '@/server/empresa/caja-view';
import { nombreMes } from '@/server/empresa/fechas';
import * as c from '@/styles/mostrador-caja.css';
import * as i from '@/styles/mostrador-impuestos.css';
import * as m from '@/styles/mostrador.css';

/** The three panels under Caja's chart (board CD-15c). */
function Cabeza(props: {
  readonly id: string;
  readonly titulo: string;
  readonly href: string;
  readonly texto: string;
}) {
  return (
    <div className={i.cabeza}>
      <h2 id={props.id} className={i.pasoTitulo}>
        {props.titulo}
      </h2>
      <Link className={m.boton.secundario} href={props.href as Route}>
        {props.texto}
      </Link>
    </div>
  );
}

function Flujo({ d }: { readonly d: DatosCaja }) {
  const f = flujoDe(d);
  return (
    <section
      className={`${m.panelPad} ${m.stack}`}
      aria-labelledby="caja-flujo"
      data-testid="caja-flujo"
    >
      <Cabeza
        id="caja-flujo"
        titulo={`Entró y salió en ${nombreMes(f.mes)}`}
        href={`/empresa/movimientos?mes=${f.mes}`}
        texto="Ver los movimientos"
      />
      <div>
        {f.renglones.map((r) => (
          <div key={r.label} className={c.renglon[r.tipo]}>
            <span>{r.label}</span>
            <span>{r.valor}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Fondeo({ f }: { readonly f: ReturnType<typeof fondeoDe> }) {
  if (f === null) return <span className={i.muted}>Ningún fondeo pendiente.</span>;
  return (
    <div className={c.tarjeta}>
      <span className={i.cabeza}>
        <span className={i.pasoTitulo}>{f.titulo}</span>
        <span className={i.pasoSub}>{f.vence}</span>
      </span>
      <span className={m.row}>
        {f.mitades.map((x) => (
          <span key={x.texto} className={`${m.tagBase} ${x.pagada ? m.tag.ok : i.tono.warn}`}>
            {x.texto}
          </span>
        ))}
      </span>
    </div>
  );
}

function Prestamos({ prestamos }: { readonly prestamos: ReturnType<typeof prestamosDe> }) {
  if (prestamos.length === 0) {
    return <span className={i.muted}>Ningún préstamo de los socios por devolver.</span>;
  }
  return prestamos.map((p) => (
    <div key={p.titulo} className={c.tarjeta}>
      <span className={i.cabeza}>
        <span className={i.pasoTitulo}>{p.titulo}</span>
        <span className={i.pasoTitulo}>{p.saldo}</span>
      </span>
      <span className={i.pasoSub}>{p.nota}</span>
    </div>
  ));
}

function Socios({ d, a }: { readonly d: DatosCaja; readonly a: Autonomia }) {
  const fondeo = fondeoDe(d);
  const prestamos = prestamosDe(d, a);
  return (
    <section
      className={`${m.panelPad} ${m.stack}`}
      aria-labelledby="caja-socios"
      data-testid="caja-socios"
    >
      <Cabeza
        id="caja-socios"
        titulo="Dinero de los socios"
        href="/empresa/socios"
        texto="Ver en Cuentas de socios"
      />
      <Fondeo f={fondeo} />
      <Prestamos prestamos={prestamos} />
    </section>
  );
}

function Pagos({ d }: { readonly d: DatosCaja }) {
  const p = pagosDe(d);
  return (
    <section
      className={`${m.panelPad} ${m.stack}`}
      aria-labelledby="caja-pagos"
      data-testid="caja-pagos"
    >
      <h2 id="caja-pagos" className={i.pasoTitulo}>
        Pagos de los próximos 30 días
      </h2>
      {p.pagos.length === 0 ? (
        <span className={i.muted}>Nada que la consola sepa que venga.</span>
      ) : (
        <div>
          {p.pagos.map((x) => (
            <Link key={x.key} className={c.pago} href={x.href as Route} data-testid="caja-pago">
              <span className={i.pasoSub}>{x.dia}</span>
              <span>
                <span className={i.pasoTitulo}>{x.nombre}</span>
                <span className={i.pasoSub}>{x.fuente}</span>
              </span>
              <span className={i.pasoTitulo}>{x.monto}</span>
            </Link>
          ))}
          <div className={c.totalPagos}>
            <span>Total</span>
            <span data-testid="caja-pagos-total">{p.total}</span>
          </div>
        </div>
      )}
      <span className={i.pasoSub}>
        Lo que la consola ya sabe que viene: los recurrentes con su monto de siempre y el ISR e IVA
        del mes, declarado o estimado.
      </span>
    </section>
  );
}

export function Paneles({ d, a }: { readonly d: DatosCaja; readonly a: Autonomia }) {
  return (
    <div className={c.paneles}>
      <Flujo d={d} />
      <Socios d={d} a={a} />
      <Pagos d={d} />
    </div>
  );
}
