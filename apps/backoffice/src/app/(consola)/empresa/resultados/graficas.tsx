import type { Barra, MesGrafica, PasoPuente, Rol } from '@/server/empresa/resultados-graficas';
import * as g from '@/styles/mostrador-graficas.css';
import * as r from '@/styles/mostrador-resultados.css';
import * as m from '@/styles/mostrador.css';

/**
 * Resultados' three charts (E-12, board CD-07), drawn from the geometry
 * `resultados-graficas.ts` computes. Every bar carries its value as text, so
 * no colour has to be read alone.
 */
const LEYENDA: readonly (readonly [string, readonly Rol[]])[] = [
  ['Ingresos', ['ingreso']],
  ['Gastos por categoría', ['costoServicio', 'ventasMarketing', 'desarrollo', 'administracion']],
  ['Impuestos y financiero', ['impuesto']],
  ['Lo que queda', ['restante']],
];

function Leyenda({ items }: { readonly items: readonly (readonly [string, readonly Rol[]])[] }) {
  return (
    <div className={g.leyenda}>
      {items.map(([label, roles]) => (
        <span key={label} className={g.leyendaItem}>
          {roles.map((rol) => (
            <span key={rol} className={`${g.muestra} ${g.rol[rol]}`} aria-hidden="true" />
          ))}
          {label}
        </span>
      ))}
    </div>
  );
}

/** An SVG in a 0–100 box stretched to its parent: bars are attributes, never inline styles. */
function Lienzo({ children }: { readonly children: React.ReactNode }) {
  return (
    <svg className={g.lleno} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {children}
    </svg>
  );
}

/** A zero still draws a hairline, so an empty step reads as zero, not as missing. */
const visible = (pct: number) => Math.max(pct, 0.6);

/** Costs stacked from the axis up, in the legend's order. */
function apilar(costos: MesGrafica['costos']) {
  let y = 100;
  return costos.map((c) => {
    y -= c.alto;
    return { ...c, y };
  });
}

export function Cascada(props: { readonly titular: string; readonly barras: readonly Barra[] }) {
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="cascada">
      <div className={r.encabezadoPanel}>
        <div>
          <h2 id="cascada" className={r.titular}>
            {props.titular}
          </h2>
          <p className={r.explica}>
            Cada barra de color es un gasto con el color de su categoría; las azules son lo que
            queda en cada nivel.
          </p>
        </div>
        <Leyenda items={LEYENDA} />
      </div>
      <div className={g.cascadaScroll}>
        <ol className={g.cascada} aria-label="De ingresos a utilidad neta">
          {props.barras.map((b) => (
            <li key={b.label} className={g.columna} data-testid="cascada-barra">
              <span className={g.valorBarra}>{b.valor}</span>
              <div className={g.lienzo}>
                <Lienzo>
                  <rect
                    x={12}
                    width={76}
                    y={100 - b.desde - visible(b.alto)}
                    height={visible(b.alto)}
                    className={g.rol[b.rol]}
                  />
                </Lienzo>
              </div>
              <span className={b.total ? g.etiquetaTotal : g.etiquetaBarra}>{b.label}</span>
              <span className={g.notaBarra}>{b.nota}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Puente(props: { readonly resumen: string; readonly pasos: readonly PasoPuente[] }) {
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="cambio">
      <h2 id="cambio" className={r.tituloPanel}>
        ¿Por qué cambió el EBITDA?
      </h2>
      <p className={r.explica}>{props.resumen}</p>
      <ul className={m.stack} aria-label="Del EBITDA anterior al de este periodo">
        {props.pasos.map((p) => (
          <li key={p.label} className={g.puenteFila} data-testid="puente-paso">
            <span className={p.total ? r.nombreSubtotal : r.nombre}>{p.label}</span>
            <span className={g.puentePista}>
              <Lienzo>
                <rect
                  x={p.desde}
                  width={visible(p.alto)}
                  y={0}
                  height={100}
                  className={g.rol[p.rol]}
                />
              </Lienzo>
            </span>
            <span className={r.nombreSubtotal}>{p.valor}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function BarrasDelMes({ mes }: { readonly mes: MesGrafica }) {
  return (
    <div className={g.mes} data-testid="tendencia-mes">
      <span className={g.valorBarra}>{mes.margen}</span>
      <div className={g.pareja}>
        <Lienzo>
          <rect
            x={10}
            width={38}
            y={100 - mes.ingresos}
            height={mes.ingresos}
            className={g.rol.ingreso}
          />
          {apilar(mes.costos).map((c) => (
            <rect key={c.rol} x={52} width={38} y={c.y} height={c.alto} className={g.rol[c.rol]} />
          ))}
        </Lienzo>
      </div>
    </div>
  );
}

export function Tendencia({ meses }: { readonly meses: readonly MesGrafica[] }) {
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="tendencia">
      <div className={r.encabezadoPanel}>
        <h2 id="tendencia" className={r.tituloPanel}>
          Ingresos contra costos, 6 meses
        </h2>
        <Leyenda items={LEYENDA.slice(0, 2)} />
      </div>
      <div className={g.tendencia}>
        {meses.map((mes) => (
          <BarrasDelMes key={mes.label} mes={mes} />
        ))}
      </div>
      <div className={g.meses}>
        {meses.map((mes) => (
          <span key={mes.label} className={g.mesLabel}>
            {mes.label}
          </span>
        ))}
      </div>
      <p className={r.explica}>Arriba de cada mes: margen EBITDA.</p>
    </section>
  );
}
