import type { LlamadaConEstado } from '@xangarro/data-corp';
import { formatDate, formatMoney, parseIsoDate } from '@xangarro/domain';

import { estadoMitad } from '@/server/empresa/socios-view';
import * as m from '@/styles/mostrador.css';
import * as s from '@/styles/mostrador-socios.css';

import { PagarMitadForm, PedirFondeoForm } from './formas';

/**
 * The screen's hero (E-03): the open funding call with each partner's half,
 * or, when none is open, the form to ask for one.
 */
function Mitad({
  call,
  socio,
  hoy,
}: {
  readonly call: LlamadaConEstado;
  readonly socio: 1 | 2;
  readonly hoy: string;
}) {
  const e = estadoMitad(call.mitades[socio], call.vence, hoy);
  return (
    <div className={s.half[e.tono]} data-testid={`mitad-${socio}`}>
      <span className={s.avatar[socio]}>F{socio}</span>
      <span className={s.halfText}>
        <span className={s.halfLabel[e.tono]}>{e.label}</span>
        <span>{e.detalle}</span>
      </span>
      {call.mitades[socio] === null ? (
        <PagarMitadForm callId={call.id} socio={socio} hoy={hoy} />
      ) : null}
    </div>
  );
}

function SinFondeo({ hoy }: { readonly hoy: string }) {
  return (
    <section className={`${m.hero} ${m.stack}`} aria-labelledby="fondeo">
      <div className={s.heroText}>
        <span className={m.eyebrow}>Fondeo por mitades</span>
        <h2 id="fondeo" className={s.heroTitle}>
          Sin fondeo pendiente
        </h2>
        <p className={m.sub}>
          Cuando la operación necesite más de lo que genera, pide el monto y cada socio pone la
          mitad. No suma a la bolsa porque ambos ponen lo mismo.
        </p>
      </div>
      <div>
        <PedirFondeoForm hoy={hoy} />
      </div>
    </section>
  );
}

export function Fondeo({
  call,
  hoy,
}: {
  readonly call: LlamadaConEstado | null;
  readonly hoy: string;
}) {
  if (call === null) return <SinFondeo hoy={hoy} />;
  return (
    <section className={`${m.hero} ${s.heroRow}`} aria-labelledby="fondeo">
      <div className={s.heroText}>
        <span className={m.eyebrow}>Fondeo por mitades</span>
        <h2 id="fondeo" className={s.heroTitle}>
          {call.concepto}: {formatMoney(call.total)}
        </h2>
        <span className={m.sub}>
          {formatMoney(call.porSocio)} cada uno · vence el {formatDate(parseIsoDate(call.vence))} ·
          no suma a la bolsa porque ambos ponen lo mismo
        </span>
      </div>
      <div className={m.row}>
        <Mitad call={call} socio={1} hoy={hoy} />
        <Mitad call={call} socio={2} hoy={hoy} />
      </div>
    </section>
  );
}
