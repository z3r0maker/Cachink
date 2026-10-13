import type { Founder } from '@xangarro/data-corp';
import { formatMoney } from '@xangarro/domain';
import type { CuentaSocio } from '@xangarro/domain/corp';

import type { FilaSocio } from '@/server/empresa/socios-view';
import * as d from '@/styles/mostrador-data.css';
import * as m from '@/styles/mostrador.css';
import * as s from '@/styles/mostrador-socios.css';

/** Each partner's account (E-03, board CD-04) and the partner movements' history. */
function Cifra(props: { readonly label: string; readonly value: bigint; readonly note?: string }) {
  return (
    <div className={s.figure}>
      <span className={s.figureLabel}>{props.label}</span>
      <span className={s.figureValue}>{formatMoney(props.value)}</span>
      {props.note === undefined ? null : <span className={s.figureNote}>{props.note}</span>}
    </div>
  );
}

export function Cuenta({
  socio,
  cuenta,
}: {
  readonly socio: Founder;
  readonly cuenta: CuentaSocio;
}) {
  return (
    <section
      className={m.panelPad}
      aria-label={`Cuenta de ${socio.nombre}`}
      data-testid={`cuenta-${socio.numero}`}
    >
      <div className={s.who}>
        <span className={s.avatar[socio.numero]}>F{socio.numero}</span>
        <span className={s.whoName}>
          Fundador {socio.numero} · {socio.nombre}
        </span>
      </div>
      <div className={s.figures}>
        <Cifra label="Capital aportado" value={cuenta.capital} />
        <Cifra label="Fondeo por mitades" value={cuenta.fondeo} />
        <Cifra
          label="Aportaciones adicionales"
          value={cuenta.adicional}
          note="cuentan para la bolsa hasta el tope del trimestre"
        />
        <Cifra
          label="Préstamos a la empresa"
          value={cuenta.prestamo}
          note={`sin intereses · reembolsado ${formatMoney(cuenta.reembolsado)}`}
        />
      </div>
    </section>
  );
}

export function Historial({ filas }: { readonly filas: readonly FilaSocio[] }) {
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="historial">
      <h2 id="historial" className={s.sectionTitle}>
        Movimientos de socios
      </h2>
      {filas.length === 0 ? (
        <p className={m.sub}>Todavía no hay dinero de socios registrado.</p>
      ) : (
        <div>
          {filas.map((f) => (
            <div key={f.id} className={s.history} data-testid="movimiento-socio">
              <span className={s.historyDate}>{f.fecha}</span>
              <span>
                {f.tipo}
                <span className={d.cellSub}>{f.quien}</span>
              </span>
              <span className={s.historyAmount}>{f.monto}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
