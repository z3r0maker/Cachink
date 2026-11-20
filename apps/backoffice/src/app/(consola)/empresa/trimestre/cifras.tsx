import type { Acumulado, Barra, Tile } from '@/server/empresa/trimestre-cifras';
import * as g from '@/styles/mostrador-graficas.css';
import * as s from '@/styles/mostrador-socios.css';
import * as q from '@/styles/mostrador-trimestre.css';
import * as m from '@/styles/mostrador.css';

/** The quarter's figures (board CD-17b): the main card, quarter against quarter, the totals. */
export function Principal(props: {
  readonly eyebrow: string;
  readonly titulo: string;
  readonly chip: string;
  readonly tiles: readonly Tile[];
}) {
  return (
    <section className={q.hero} aria-labelledby="cifras" data-testid="trimestre-cifras">
      <div className={q.heroCabeza}>
        <span>
          <span className={m.eyebrow}>{props.eyebrow}</span>
          <h2 id="cifras" className={q.heroTitulo}>
            {props.titulo}
          </h2>
        </span>
        <span className={`${m.tagBase} ${props.chip === 'Cerrado' ? m.tag.ok : m.tag.off}`}>
          {props.chip}
        </span>
      </div>
      <div className={q.tiles}>
        {props.tiles.map((t) => (
          <div key={t.label} className={q.tile} data-testid="trimestre-tile">
            <span className={m.tileLabel}>{t.label}</span>
            <span className={q.tileValor}>{t.value}</span>
            <span className={`${q.delta} ${q.tono[t.tono]}`}>{t.delta}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Bars in a 0–100 box with the axis at 80: income and EBITDA up, a loss down. */
const EJE = 80;

function Barras({ b, max }: { readonly b: Barra; readonly max: bigint }) {
  const alto = (v: bigint) =>
    max === 0n ? 0 : Math.max(0.8, (Number(v < 0n ? -v : v) / Number(max)) * (EJE - 2));
  const perdida = b.ebitda < 0n;
  return (
    <svg className={q.barras} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <rect
        x={4}
        width={44}
        y={EJE - alto(b.ingresos)}
        height={alto(b.ingresos)}
        className={g.rol.ingreso}
      />
      {perdida ? (
        <rect
          x={52}
          width={44}
          y={EJE}
          height={Math.min(alto(b.ebitda), 100 - EJE)}
          className={g.rol.perdida}
        />
      ) : (
        <rect
          x={52}
          width={44}
          y={EJE - alto(b.ebitda)}
          height={alto(b.ebitda)}
          className={g.rol.restante}
        />
      )}
      <line x1={0} x2={100} y1={EJE} y2={EJE} className={q.eje} />
    </svg>
  );
}

const LEYENDA = [
  ['Ingresos', 'ingreso'],
  ['EBITDA', 'restante'],
  ['Pérdida', 'perdida'],
] as const;

function Leyenda() {
  return (
    <div className={g.leyenda}>
      {LEYENDA.map(([label, rol]) => (
        <span key={label} className={g.leyendaItem}>
          <span className={`${g.muestra} ${g.rol[rol]}`} aria-hidden="true" />
          {label}
        </span>
      ))}
    </div>
  );
}

export function Crecimiento({ barras }: { readonly barras: readonly Barra[] }) {
  const max = barras.reduce(
    (a, b) =>
      [a, b.ingresos, b.ebitda < 0n ? -b.ebitda : b.ebitda].reduce((x, y) => (y > x ? y : x)),
    0n,
  );
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="qoq">
      <h2 id="qoq" className={s.sectionTitle}>
        Trimestre contra trimestre
      </h2>
      <Leyenda />
      <div className={q.trimestres}>
        {barras.map((b) => (
          <div key={b.label} className={q.trimestre} data-testid="trimestre-barra">
            <span className={`${q.delta} ${q.tono[b.tono]}`}>{b.crecimiento}</span>
            <Barras b={b} max={max} />
            <span className={q.etiqueta}>{b.label}</span>
            <span className={q.nota}>{b.valores}</span>
          </div>
        ))}
      </div>
      <span className={q.nota}>
        Arriba: ingresos contra el trimestre anterior. Sin ingresos en el anterior dice «sin base».
      </span>
    </section>
  );
}

export function Acumulados(props: { readonly filas: readonly Acumulado[]; readonly nota: string }) {
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="acumulado">
      <h2 id="acumulado" className={s.sectionTitle}>
        Acumulado
      </h2>
      <div className={q.acumulado}>
        {props.filas.map((a) => (
          <div key={a.label} className={q.tile} data-testid="trimestre-acumulado">
            <span className={m.tileLabel}>{a.label}</span>
            <span className={q.tileValor}>{a.value}</span>
            <span className={q.nota}>{a.desdeElInicio}</span>
          </div>
        ))}
      </div>
      <span className={q.nota}>{props.nota}</span>
    </section>
  );
}
