import { formatMoney } from '@xangarro/domain';

import { Don } from '../../components/don/don';
import { desglose } from '@xangarro/caja/turno';
import * as s from './cierre.css';
import { DIF, FALTA_PENDIENTE, MOTIVOS_DIFERENCIA, type CierreData } from '@xangarro/caja/cierre';
import * as d from './don.css';
import type { Cierre } from './use-cierre';

/** The yellow card: expected cash and its four parts; «Puede cambiar» while records wait. */
export function Esperado({ x, data }: { readonly x: Cierre; readonly data: CierreData }) {
  return (
    <section aria-label="Efectivo esperado" className={s.esperado}>
      <div className={s.esperadoHead}>
        <span className={s.eyebrow}>Efectivo esperado</span>
        {x.pendientes > 0 ? <span className={s.puedeCambiar}>Puede cambiar</span> : null}
        <span className={s.esperadoCifra}>{formatMoney(x.esperado)}</span>
      </div>
      <div style={{ marginTop: 8 }}>
        {desglose(data.partes).map(([label, value], i) => (
          <div key={label} className={s.parte}>
            <span>{label}</span>
            <span className={s.parteValor} data-gasto={i === 3 ? '' : undefined}>
              {i === 1 || i === 2 ? `+${value}` : value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Cuadra (green), Falta (red) or Sobra (blue); with a difference, the reason. */
export function Diferencia({ x, dueno }: { readonly x: Cierre; readonly dueno: string }) {
  if (x.contado === 0n) return <SinContar />;
  const t = DIF[x.dif.tipo];
  return (
    <section aria-label="Diferencia" aria-live="polite" className={s.dif[x.dif.tipo]}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <span className={s.eyebrow}>Diferencia</span>
        <span className={s.difCifra} style={{ color: t.color }}>
          <span>{t.label}</span> <span className={s.mono}>{formatMoney(x.dif.monto)}</span>
        </span>
      </div>
      <Aviso x={x} />
      {x.dif.tipo === 'cuadra' ? null : <Explica x={x} dueno={dueno} />}
    </section>
  );
}

/** Nothing counted yet: no red «Falta», only what to do next. */
function SinContar() {
  return (
    <section aria-label="Diferencia" aria-live="polite" className={s.difVacio}>
      <span className={s.eyebrow}>Diferencia</span>
      <p className={s.texto}>
        Cuenta los billetes y las monedas de la caja. Aquí verás si cuadra con lo esperado.
      </p>
    </section>
  );
}

/** On a shortfall Don worries (once the count is final); otherwise one line. */
function Aviso({ x }: { readonly x: Cierre }) {
  if (x.dif.tipo === 'falta' && x.pendientes > 0)
    return <p className={s.texto}>{FALTA_PENDIENTE}</p>;
  if (x.dif.tipo !== 'falta') return <p className={s.texto}>{DIF[x.dif.tipo].hint}</p>;
  return (
    <div className={d.dice}>
      <Don pose="preocupado" size={90} />
      <p className={d.bubble}>{DIF.falta.hint}</p>
    </div>
  );
}

function Explica({ x, dueno }: { readonly x: Cierre; readonly dueno: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span id="motivo-lbl" className={s.eyebrow}>
        Explica la diferencia
      </span>
      <div
        role="group"
        aria-labelledby="motivo-lbl"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
      >
        {MOTIVOS_DIFERENCIA.map((m) => (
          <button
            key={m}
            type="button"
            className={s.motivo}
            aria-pressed={x.motivo === m}
            onClick={() => x.setMotivo(m)}
          >
            {m}
          </button>
        ))}
      </div>
      {x.motivo === 'Otra razón' ? (
        <label className={s.nota}>
          <span className={s.notaLabel}>{`Nota para ${dueno}`}</span>
          <input
            type="text"
            className={s.notaInput}
            placeholder="Cuéntale qué pasó"
            value={x.nota}
            onChange={(e) => x.setNota(e.target.value)}
          />
        </label>
      ) : null}
    </div>
  );
}
