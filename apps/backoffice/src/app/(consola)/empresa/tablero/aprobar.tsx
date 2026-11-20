import { sinValorEnElPlan } from '@xangarro/application/corp';
import { formatMoneyEntero } from '@xangarro/domain';
import {
  nombreTrimestre,
  resumenDelTrimestre,
  trimestreAnterior,
  type ResumenTrimestre,
  type Socio,
} from '@xangarro/domain/corp';

import { Cajon } from '@/components/cajon';
import { fechaCorta } from '@/server/empresa/fechas';
import type { Nombres } from '@/server/empresa/socios-view';
import type { LecturaTablero } from '@/server/empresa/tablero-lectura';
import { hrefTablero, type ParamsTablero } from '@/server/empresa/tablero-view';
import type { VistaTablero } from '@/server/empresa/tablero-vista';
import * as i from '@/styles/mostrador-impuestos.css';
import * as t from '@/styles/mostrador-tablero.css';
import * as m from '@/styles/mostrador.css';

import { ResponderPlanForm } from './formas-plan';

/**
 * «Aprobar el plan» (board CD-13d): each partner's deliverables and
 * commitment next to the quarter before, then «Aprobar» or «Rechazar» for
 * the partner who did not send it.
 */
type Props = {
  readonly l: LecturaTablero;
  readonly p: ParamsTablero;
  readonly v: VistaTablero;
  readonly yo: Socio;
};

function Tabla(props: {
  readonly r: ResumenTrimestre;
  readonly previo: ResumenTrimestre;
  readonly nombres: Nombres;
}) {
  const { r, previo } = props;
  const cuantos = (s: Socio) =>
    r.tarjetas.filter((x) => x.tarjeta.tipo === 'entregable' && x.tarjeta.responsable === s).length;
  return (
    <table className={t.tabla}>
      <thead>
        <tr>
          <th className={t.celdaTexto}>Socio</th>
          <th className={t.celda}>Entregables</th>
          <th className={t.celda}>Comprometido</th>
          <th className={t.celda}>{`En el ${nombreTrimestre(previo.trimestre)}`}</th>
        </tr>
      </thead>
      <tbody>
        {r.socios.map((s, n) => (
          <tr key={s.socio}>
            <td className={t.celdaTexto}>{props.nombres[s.socio]}</td>
            <td className={t.celda}>{cuantos(s.socio)}</td>
            <td className={t.celda}>{formatMoneyEntero(s.comprometido)}</td>
            <td className={t.celda}>{formatMoneyEntero(previo.socios[n]?.comprometido ?? 0n)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Notas({ l, p, v }: Props) {
  const sinValor = sinValorEnElPlan(l.datos, p.trimestre, l.hoy);
  const q = nombreTrimestre(p.trimestre);
  return (
    <>
      <span className={i.muted}>
        {sinValor === 0
          ? 'Todas las tarjetas tienen valor.'
          : `Faltan valores en ${sinValor} tarjetas: sin ellos no se puede aprobar.`}
      </span>
      <span className={i.muted}>
        {v.desbalance ?? 'Ningún compromiso es menor a la mitad del otro.'}
      </span>
      <span className={i.muted}>
        {`Al aprobarlo, los valores quedan congelados para el ${q}. Una tarjeta nueva cuenta cuando los dos le pongan valor.`}
      </span>
    </>
  );
}

export function AprobarCajon(props: Props) {
  const { l, p, v, yo } = props;
  const r = v.resumen;
  const q = nombreTrimestre(p.trimestre);
  const antes = trimestreAnterior(p.trimestre);
  const previo = resumenDelTrimestre({
    trimestre: antes,
    tarjetas: l.datos.tarjetas,
    planes: l.datos.planes,
    hoy: l.hoy,
  });
  const sub =
    r.plan.fase === 'enviado'
      ? `Lo envió ${l.nombres[r.plan.por]} el ${fechaCorta(r.plan.el)}. Quien lo envía no puede aprobarlo.`
      : 'El plan todavía no se envía.';
  return (
    <Cajon
      eyebrow={`Tablero · ${q}`}
      titulo={`Aprobar el plan del ${q}`}
      sub={sub}
      cerrar={hrefTablero(p.trimestre)}
      ancho="amplio"
    >
      <div className={m.stack} data-testid="aprobar-plan">
        <Tabla r={r} previo={previo} nombres={l.nombres} />
        <Notas {...props} />
        {r.plan.fase === 'enviado' && r.plan.por !== yo ? (
          <div className={m.row}>
            <ResponderPlanForm trimestre={p.trimestre} aprobar texto={`Aprobar el plan del ${q}`} />
            <ResponderPlanForm trimestre={p.trimestre} aprobar={false} texto="Rechazar" />
          </div>
        ) : null}
        <span className={i.muted}>
          {`Si no hay plan aprobado el ${fechaCorta(r.limitePlan)}, el compromiso de cada socio en el ${q} es el que tuvo en el ${nombreTrimestre(antes)}.`}
        </span>
      </div>
    </Cajon>
  );
}
