import {
  DENOMINACIONES_MXN,
  formatMoney,
  sum,
  totalContado,
  type ConteoDenominaciones,
  type Denominacion,
} from '@xangarro/domain';

import { srOnly } from '@/styles/global.css';

import * as s from './conteo.css';
import { ceja, seccion } from './panel.css';

const BILLETES = DENOMINACIONES_MXN.filter((d) => d.tipo === 'billete');
const MONEDAS = DENOMINACIONES_MXN.filter((d) => d.tipo === 'moneda');

/** «$1,000» on the tile; «50¢» stays as it is. */
const etiqueta = (d: Denominacion): string => d.etiqueta.replace(/^\$(\d)(\d{3})$/, '$$$1,$2');

const subtotal = (conteo: ConteoDenominaciones, ds: readonly Denominacion[]) =>
  sum(ds.map((d) => d.valor * BigInt(conteo[d.clave] ?? 0)));

function Grupo(p: {
  readonly nombre: 'Billetes' | 'Monedas';
  readonly ds: readonly Denominacion[];
  readonly conteo: ConteoDenominaciones;
}) {
  const cual = p.nombre === 'Billetes' ? 'billete' : 'moneda';
  return (
    <div className={s.grupo}>
      <span className={s.grupoNombre} aria-hidden="true">
        {p.nombre}
      </span>
      <ul className={s.piezas} aria-label={p.nombre}>
        {p.ds.map((d) => {
          const n = p.conteo[d.clave] ?? 0;
          return (
            <li
              key={d.clave}
              className={s.pieza}
              data-tipo={d.tipo}
              data-cero={n === 0 ? '' : undefined}
            >
              <span className={s.den} aria-hidden="true">
                {etiqueta(d)}
              </span>
              <span className={s.veces} aria-hidden="true">{`×${n}`}</span>
              <span className={srOnly}>{`${etiqueta(d)} ${cual}: ${n}`}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Every denomination the caja counts, bills and coins apart (the $20 is both),
 * down to the 10¢; the ones not counted sit on gray.
 */
export function Conteo({ conteo }: { readonly conteo: ConteoDenominaciones }) {
  return (
    <section className={seccion}>
      <div className={s.cabeza}>
        <h3 className={ceja}>Lo que contó, por denominación</h3>
        <span className={s.total}>{formatMoney(totalContado(conteo))}</span>
      </div>
      <Grupo nombre="Billetes" ds={BILLETES} conteo={conteo} />
      <Grupo nombre="Monedas" ds={MONEDAS} conteo={conteo} />
      <span className={s.subtotales}>
        {`Billetes ${formatMoney(subtotal(conteo, BILLETES))} · Monedas ${formatMoney(subtotal(conteo, MONEDAS))}`}
      </span>
    </section>
  );
}
