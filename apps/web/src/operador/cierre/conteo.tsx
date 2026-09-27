import {
  DENOMINACIONES_MXN,
  formatMoney,
  totalContado,
  type ConteoDenominaciones,
  type Denominacion,
} from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import * as c from './conteo.css';
import type { Cierre } from './use-cierre';

const MENOS = 'M5 12h14';
const MAS = 'M12 5v14M5 12h14';

/** Each bill its own tint; peso coins share gray, centavos amber. */
function tinte(d: Denominacion): string {
  switch (d.clave) {
    case 'billete-1000':
      return colors.purpleSoft;
    case 'billete-500':
      return colors.peachSoft;
    case 'billete-200':
      return colors.greenSoft;
    case 'billete-100':
      return colors.redSoft;
    case 'billete-50':
    case 'billete-20':
      return colors.blueSoft;
    default:
      return d.valor < 1_00n ? colors.warningSoft : colors.gray100;
  }
}

const BILLETES = DENOMINACIONES_MXN.filter((d) => d.tipo === 'billete');
const MONEDAS = DENOMINACIONES_MXN.filter((d) => d.tipo === 'moneda');

/** Only this kind's pieces, so each column shows its own subtotal. */
function subtotal(conteo: ConteoDenominaciones, lista: readonly Denominacion[]): bigint {
  const solo: Record<string, number> = {};
  for (const d of lista) solo[d.clave] = conteo[d.clave] ?? 0;
  return totalContado(solo);
}

/** «Cuenta el efectivo de la caja»: bills $1000 to $20, coins $20 to 10¢, all in centavos. */
export function Conteo({ x }: { readonly x: Cierre }) {
  return (
    <section aria-label="Cuenta el efectivo de la caja" className={c.card}>
      <div className={c.head}>
        <span className={c.eyebrow}>Cuenta el efectivo de la caja</span>
        <button type="button" className={c.limpiar} onClick={x.limpiar}>
          Empezar de cero
        </button>
      </div>
      <div className={c.columnas}>
        <Columna titulo="Billetes" lista={BILLETES} x={x} />
        <Columna titulo="Monedas" lista={MONEDAS} x={x} />
      </div>
      <div className={c.pie}>
        <span className={c.eyebrow}>Contaste</span>
        <span className={c.contado}>{formatMoney(x.contado)}</span>
      </div>
    </section>
  );
}

function Columna(p: {
  readonly titulo: string;
  readonly lista: readonly Denominacion[];
  readonly x: Cierre;
}) {
  return (
    <div className={c.columna}>
      <span className={c.colHead}>
        {p.titulo}
        <span className={c.subtotal}>{formatMoney(subtotal(p.x.conteo, p.lista))}</span>
      </span>
      {p.lista.map((d) => (
        <Fila key={d.clave} d={d} n={p.x.conteo[d.clave] ?? 0} poner={p.x.poner} />
      ))}
    </div>
  );
}

/** «billetes de $20» / «monedas de $20»: the two $20 never share a name. */
export const nombreDe = (d: Denominacion): string =>
  `${d.tipo === 'billete' ? 'billetes' : 'monedas'} de ${d.etiqueta}`;

function Fila(p: {
  readonly d: Denominacion;
  readonly n: number;
  readonly poner: Cierre['poner'];
}) {
  const { d, n } = p;
  const nombre = nombreDe(d);
  const moneda = d.tipo === 'moneda' ? '' : undefined;
  return (
    <div className={c.fila}>
      <span className={c.denom} data-moneda={moneda} style={{ background: tinte(d) }}>
        {d.etiqueta}
      </span>
      <span className={c.pasos}>
        <Paso label={`Uno menos: ${nombre}`} path={MENOS} onClick={() => p.poner(d.clave, n - 1)} />
        <input
          type="text"
          inputMode="numeric"
          aria-label={`${d.tipo === 'billete' ? 'Cuántos' : 'Cuántas'} ${nombre}`}
          className={c.piezas}
          value={String(n)}
          onChange={(e) =>
            p.poner(d.clave, Number.parseInt(e.target.value.replace(/\D/g, '') || '0', 10))
          }
        />
        <Paso label={`Uno más: ${nombre}`} path={MAS} mas onClick={() => p.poner(d.clave, n + 1)} />
      </span>
    </div>
  );
}

function Paso(p: {
  readonly label: string;
  readonly path: string;
  readonly mas?: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={c.paso}
      data-mas={p.mas ? '' : undefined}
      aria-label={p.label}
      onClick={p.onClick}
    >
      <Icon path={p.path} size={16} strokeWidth={2.8} />
    </button>
  );
}
