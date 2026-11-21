import {
  nombreTrimestre,
  rangoDelTrimestre,
  ultimoDiaDelTrimestre,
  type Socio,
} from '@xangarro/domain/corp';

import { Cajon } from '@/components/cajon';
import { fechaCorta } from '@/server/empresa/fechas';
import { cajonDe } from '@/server/empresa/tablero-cajon';
import type { LecturaTablero } from '@/server/empresa/tablero-lectura';
import { hrefTablero, type ParamsTablero } from '@/server/empresa/tablero-view';
import type { VistaTablero } from '@/server/empresa/tablero-vista';
import * as i from '@/styles/mostrador-impuestos.css';
import * as t from '@/styles/mostrador-tablero.css';
import * as m from '@/styles/mostrador.css';

import { AprobarCajon } from './aprobar';
import { AvisoCajon } from './aviso';
import { AvanceForm, NuevoObjetivoForm } from './formas-plan';
import { NuevaTarjetaForm } from './formas-tarjeta';
import { TarjetaCajon } from './tarjeta';

/** The Tablero's drawers (boards CD-13c and CD-13d), one at a time by the URL. */
type Props = {
  readonly l: LecturaTablero;
  readonly p: ParamsTablero;
  readonly v: VistaTablero;
  readonly yo: Socio;
  /** A card was just accepted: its drawer's state lands as a stamp (ADR-161). */
  readonly sello?: boolean;
};

function Nueva({ l, p, yo }: Props) {
  const [desde] = rangoDelTrimestre(p.trimestre);
  const q = nombreTrimestre(p.trimestre);
  return (
    <Cajon
      eyebrow={`Tablero · ${q}`}
      titulo="Nueva tarjeta"
      sub={`Entra al ${q}. Cuenta cuando los dos le ponen valor.`}
      cerrar={hrefTablero(p.trimestre)}
    >
      <NuevaTarjetaForm
        trimestre={p.trimestre}
        desde={desde}
        hasta={ultimoDiaDelTrimestre(p.trimestre)}
        nombres={l.nombres}
        yo={yo}
        objetivos={l.datos.objetivos.filter((o) => o.trimestre === p.trimestre)}
      />
    </Cajon>
  );
}

function NuevoObjetivo({ l, p }: Props) {
  return (
    <Cajon
      eyebrow={`Tablero · ${nombreTrimestre(p.trimestre)}`}
      titulo="Nuevo objetivo"
      sub="Se mide, no suma valor a la bolsa."
      cerrar={hrefTablero(p.trimestre)}
    >
      <NuevoObjetivoForm trimestre={p.trimestre} nombres={l.nombres} />
    </Cajon>
  );
}

function Avance({ l, p }: Props) {
  const o = l.datos.objetivos.find((x) => x.id === p.objetivo);
  if (o === undefined) return null;
  const ultimo = o.avances.at(-1);
  const antes =
    ultimo === undefined
      ? 'Sin avance todavía.'
      : `Antes: ${ultimo.valor}, el ${fechaCorta(ultimo.fecha)}.`;
  const ligadas = l.datos.tarjetas.filter((x) => x.objetivoId === o.id);
  return (
    <Cajon
      eyebrow={`Objetivo · ${o.quien === null ? 'Ambos' : l.nombres[o.quien]}`}
      titulo={o.titulo}
      sub={`${nombreTrimestre(o.trimestre)} · vence el ${fechaCorta(ultimoDiaDelTrimestre(o.trimestre))}`}
      cerrar={hrefTablero(p.trimestre)}
    >
      <div className={m.stack}>
        <AvanceForm
          trimestre={p.trimestre}
          objetivo={o.id}
          hint={`De ${o.meta} ${o.unidad}. ${antes}`}
        />
        {ligadas.length === 0 ? null : (
          <div className={m.stack}>
            <span className={m.tileLabel}>Entregables ligados</span>
            {ligadas.map((x) => (
              <span key={x.id} className={t.leyenda}>
                {x.titulo}
              </span>
            ))}
          </div>
        )}
        <span className={i.muted}>
          Un objetivo se mide, no suma valor a la bolsa. Al cerrar el trimestre queda cumplido o no
          cumplido.
        </span>
      </div>
    </Cajon>
  );
}

export function Paneles(props: Props) {
  const { l, p, yo } = props;
  if (p.tarjeta !== null) {
    const c = cajonDe(l.datos, p.tarjeta, p.trimestre, yo, l.nombres, l.hoy);
    return c === null ? null : (
      <TarjetaCajon c={c} trimestre={p.trimestre} sello={props.sello === true} />
    );
  }
  if (p.objetivo !== null) return <Avance {...props} />;
  switch (p.panel) {
    case 'nueva':
      return props.v.puedeAgregar ? <Nueva {...props} /> : null;
    case 'nuevo-objetivo':
      return props.v.puedeAgregar ? <NuevoObjetivo {...props} /> : null;
    case 'plan':
      return <AprobarCajon {...props} />;
    case 'aviso':
    case 'clausula':
      return <AvisoCajon l={l} trimestre={p.trimestre} yo={yo} />;
    default:
      return null;
  }
}
