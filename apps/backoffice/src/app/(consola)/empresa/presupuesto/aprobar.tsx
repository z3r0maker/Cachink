import { nombreTrimestre, type Presupuesto } from '@xangarro/domain/corp';

import { Cajon } from '@/components/cajon';
import { diaDe } from '@/server/empresa/fechas';
import type { Calculo } from '@/server/empresa/presupuesto-calculo';
import { revisionDe, type Revision } from '@/server/empresa/presupuesto-paneles';
import {
  hrefPresupuesto,
  nombreDe,
  type DatosPresupuesto,
  type VistaPresupuesto,
} from '@/server/empresa/presupuesto-view';
import * as i from '@/styles/mostrador-impuestos.css';
import * as p from '@/styles/mostrador-presupuesto.css';
import * as m from '@/styles/mostrador.css';

import { ResponderPresupuestoForm } from './formas';

/**
 * «Aprobar el presupuesto» (board CD-15e), for the founder who did not
 * prepare it: each proposed amount next to the quarter it follows and what
 * was spent in it, then «Aprobar» or «Rechazar».
 */
function Tabla({ r }: { readonly r: Revision }) {
  return (
    <table className={p.tabla} data-testid="aprobar-tabla">
      <thead>
        <tr>
          <th className={p.celdaNombre}>Categoría</th>
          <th className={p.celda}>Propuesto</th>
          <th className={p.celda}>{r.ref}</th>
          <th className={p.celda}>{`Gastado ${r.ref}`}</th>
        </tr>
      </thead>
      <tbody>
        {[...r.filas, r.total].map((f) => {
          const total = f === r.total;
          return (
            <tr key={f.nombre}>
              <td className={total ? p.celdaTotal : p.celdaNombre}>{f.nombre}</td>
              <td className={total ? p.celdaTotal : p.celda}>{f.propuesto}</td>
              <td className={total ? p.celdaTotal : p.celda}>{f.antes}</td>
              <td className={total ? p.celdaTotal : p.celda}>{f.real}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function Aprobar(props: {
  readonly c: Calculo;
  readonly d: DatosPresupuesto;
  readonly pendiente: Presupuesto;
  readonly vista: VistaPresupuesto;
}) {
  const { pendiente, vista } = props;
  const r = revisionDe(props.c, pendiente, props.d.presupuestos);
  const t = nombreTrimestre(pendiente.trimestre);
  const quien = nombreDe(props.d.socios, pendiente.preparadoPor);
  return (
    <Cajon
      eyebrow={`Presupuesto · ${t}`}
      titulo={`Aprobar el presupuesto del ${t}`}
      sub={`Lo preparó ${quien} el ${diaDe(pendiente.preparadoAt)}. Junto a cada monto, lo del ${r.ref} y lo que se gastó.`}
      cerrar={hrefPresupuesto(vista)}
    >
      <div className={m.stack}>
        <Tabla r={r} />
        <p className={i.muted}>{r.nota}</p>
        <div className={m.row}>
          {(['aprobar', 'rechazar'] as const).map((r) => (
            <ResponderPresupuestoForm
              key={r}
              id={pendiente.id}
              vista={vista}
              respuesta={r}
              texto={r === 'aprobar' ? `Aprobar el presupuesto del ${t}` : 'Rechazar'}
            />
          ))}
        </div>
        <p className={i.muted}>
          {`Si lo rechazas, ${quien} puede preparar otro. Quien lo prepara no puede aprobarlo.`}
        </p>
      </div>
    </Cajon>
  );
}
