import type { CategoriaGasto } from '@xangarro/domain/corp';

import type { BarraMes } from '@/server/empresa/servicios-uso-view';
import * as g from '@/styles/mostrador-graficas.css';
import * as s from '@/styles/mostrador-servicios.css';

/**
 * Six months of a service's cost (E-24, boards CD-18 and CD-18c): SVG rects
 * in a 0–100 box, in its category's colour; the current month projected is
 * the same colour lighter, labelled «*». The alert, when it has one, is a
 * dashed line. On the detail each bar carries its value as text.
 */
export const ROL = {
  costo_servicio: 'costoServicio',
  ventas_marketing: 'ventasMarketing',
  desarrollo: 'desarrollo',
  administracion: 'administracion',
} as const satisfies Record<CategoriaGasto, keyof typeof g.rol>;

const ANCHO = 100 / 6;

function Aviso({ alto }: { readonly alto: number }) {
  const y = Math.max(0, 100 - alto - 0.4);
  return (
    <>
      {Array.from({ length: 25 }, (_, i) => (
        <rect key={i} className={s.lineaAviso} x={i * 4} y={y} width={2} height={0.8} />
      ))}
    </>
  );
}

function Lienzo(props: {
  readonly barras: readonly BarraMes[];
  readonly rol: string;
  readonly aviso: number | null;
}) {
  return (
    <svg className={g.lleno} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {props.barras.map((b, i) => (
        <rect
          key={b.mes}
          className={b.proyeccion ? `${props.rol} ${s.proyectada}` : props.rol}
          x={i * ANCHO + ANCHO * 0.15}
          width={ANCHO * 0.7}
          y={100 - Math.max(b.alto, 0.6)}
          height={Math.max(b.alto, 0.6)}
        />
      ))}
      {props.aviso === null ? null : <Aviso alto={props.aviso} />}
    </svg>
  );
}

export function Barras(props: {
  readonly barras: readonly BarraMes[];
  readonly categoria: CategoriaGasto;
  readonly aviso?: number | null;
  readonly grande?: boolean;
}) {
  const grande = props.grande === true;
  return (
    <div>
      {grande ? (
        <div className={s.valores} aria-hidden="true">
          {props.barras.map((b) => (
            <span key={b.mes}>{b.valor}</span>
          ))}
        </div>
      ) : null}
      <div className={grande ? s.barrasGrande : s.barras}>
        <Lienzo
          barras={props.barras}
          rol={g.rol[ROL[props.categoria]]}
          aviso={props.aviso ?? null}
        />
      </div>
      <ol className={s.meses} aria-label="Costo de cada mes">
        {props.barras.map((b) => (
          <li key={b.mes} aria-label={`${b.etiqueta}: ${b.valor}`}>
            {b.etiqueta}
          </li>
        ))}
      </ol>
    </div>
  );
}
