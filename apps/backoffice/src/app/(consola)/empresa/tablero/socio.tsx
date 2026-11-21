import { Odometro } from '@/components/odometro';
import type { SocioVista } from '@/server/empresa/tablero-partes';
import * as i from '@/styles/mostrador-impuestos.css';
import * as mv from '@/styles/mostrador-movimiento.css';
import * as s from '@/styles/mostrador-socios.css';
import * as t from '@/styles/mostrador-tablero.css';
import * as m from '@/styles/mostrador.css';

/**
 * Each partner's tile on the Tablero (board CD-13b): the chip, what was
 * committed, accepted and in review, and the bar against the 50 % line. With
 * ADR-161's motion the bar fills and the figures roll; «En curso» carries
 * the live dot, and right after the plan is approved the chips land as stamps.
 */
function Barra({ v }: { readonly v: SocioVista }) {
  return (
    <svg className={t.pista} viewBox="0 0 400 26" preserveAspectRatio="none" aria-hidden="true">
      <rect className={t.barra.fondo} x="0" y="6" width="400" height="14" rx="4" />
      <rect
        className={`${t.barra.revision} ${mv.llena}`}
        x="0"
        y="6"
        width={v.anchoRevision * 4}
        height="14"
        rx="4"
      />
      <rect
        className={`${t.barra.aceptado} ${mv.llena}`}
        x="0"
        y="6"
        width={v.anchoAceptado * 4}
        height="14"
        rx="4"
      />
      <line className={t.barra.linea} x1="200" x2="200" y1="0" y2="26" />
    </svg>
  );
}

function Socio({ v, sello }: { readonly v: SocioVista; readonly sello: boolean }) {
  return (
    <section
      className={`${m.panelPad} ${m.stack}`}
      aria-label={v.nombre}
      data-testid={`tablero-socio-${v.socio}`}
    >
      <div className={s.heroRow}>
        <span className={s.who}>
          <span className={s.avatar[v.socio]}>{v.iniciales}</span>
          <span className={s.whoName}>{v.nombre}</span>
        </span>
        <span className={`${i.chipBase} ${i.tono[v.tono]}${sello ? ` ${mv.sello}` : ''}`}>
          {v.chip === 'En curso' ? <span className={mv.vivo} aria-hidden="true" /> : null}
          {v.chip}
        </span>
      </div>
      <div className={s.figures}>
        {(
          [
            ['Comprometido', v.comprometido],
            ['Aceptado', v.aceptado],
            ['En revisión', v.revision],
          ] as const
        ).map(([label, valor]) => (
          <span key={label} className={s.figure}>
            <span className={s.figureLabel}>{label}</span>
            <Odometro
              className={s.figureValue}
              texto={valor}
              testId={`tablero-${label === 'En revisión' ? 'revision' : label.toLowerCase()}-${v.socio}`}
            />
          </span>
        ))}
      </div>
      <Barra v={v} />
      <span className={t.leyenda}>Línea: mínimo para cumplir (50 %) · {v.nota}</span>
    </section>
  );
}

export function Socios(props: {
  readonly socios: readonly SocioVista[];
  readonly desbalance: string | null;
  /** The plan was approved by the action that brought the founder here. */
  readonly sello: boolean;
}) {
  return (
    <>
      <div className={s.grid2}>
        {props.socios.map((v) => (
          <Socio key={v.socio} v={v} sello={props.sello} />
        ))}
      </div>
      {props.desbalance === null ? null : (
        <p className={t.aviso} role="status" data-testid="tablero-desbalance">
          {props.desbalance}
        </p>
      )}
    </>
  );
}
