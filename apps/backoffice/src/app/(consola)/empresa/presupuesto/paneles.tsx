import { formatMoney } from '@xangarro/domain';
import { estadoDeSolicitud, totalMensual, usadoDelLimite } from '@xangarro/domain/corp';

import { Cajon } from '@/components/cajon';
import { diaDe, nombreMes } from '@/server/empresa/fechas';
import type { Calculo } from '@/server/empresa/presupuesto-calculo';
import { trimestreParaPreparar } from '@/server/empresa/presupuesto-encabezado';
import { prepararDe } from '@/server/empresa/presupuesto-paneles';
import {
  hrefPresupuesto,
  nombreCategoria,
  nombreDe,
  otroSocio,
  type DatosPresupuesto,
  type PanelPresupuesto,
  type VistaPresupuesto,
} from '@/server/empresa/presupuesto-view';
import * as i from '@/styles/mostrador-impuestos.css';
import * as p from '@/styles/mostrador-presupuesto.css';
import * as m from '@/styles/mostrador.css';

import { Aprobar } from './aprobar';
import { PrepararForm } from './formas';
import { OtroMontoForm, PedirForm, type Mes } from './formas-gasto';

/**
 * Board CD-15e's panels over Presupuesto. Each opens only when it may be
 * used (a quarter to prepare, a budget or a request waiting on this founder);
 * otherwise the page shows as it is.
 */
interface Props {
  readonly panel: PanelPresupuesto | null;
  readonly solicitud: string | null;
  readonly vista: VistaPresupuesto;
  readonly c: Calculo;
  readonly d: DatosPresupuesto;
  readonly founderId: string;
}

const mesDe = (c: Calculo): Mes => ({
  mes: c.mes,
  proyeccion: String(totalMensual(c.delMes.proyeccion)),
  presupuesto: c.vigente === null ? '' : String(totalMensual(c.vigente.montos)),
});

const eyebrowMes = (c: Calculo) => `Presupuesto · ${nombreMes(c.mes)} de ${c.mes.slice(0, 4)}`;

function Preparar({
  c,
  d,
  vista,
  founderId,
  trimestre,
}: Omit<Props, 'panel' | 'solicitud'> & { readonly trimestre: string }) {
  const otro = otroSocio(d.socios, founderId);
  const v = prepararDe(c, trimestre, otro);
  return (
    <Cajon
      eyebrow={`Presupuesto · ${v.nombre}`}
      titulo={`Preparar el presupuesto del ${v.nombre}`}
      sub={v.sub}
      cerrar={hrefPresupuesto(vista)}
    >
      <PrepararForm
        trimestre={v.trimestre}
        nombre={v.nombre}
        vista={vista}
        campos={v.campos}
        antes={v.antes}
        otro={otro}
        pasos={v.pasos}
      />
    </Cajon>
  );
}

function OtroMonto({
  c,
  d,
  vista,
  id,
}: Omit<Props, 'panel' | 'solicitud' | 'founderId'> & { readonly id: string }) {
  const s = d.solicitudes.find((x) => x.id === id);
  if (s === undefined) return null;
  const quien = nombreDe(d.socios, s.founderId);
  return (
    <Cajon
      eyebrow={eyebrowMes(c)}
      titulo="Aprobar con otro monto"
      sub="Apruebas una parte; el resto queda rechazado."
      cerrar={hrefPresupuesto(vista)}
    >
      <div className={m.stack}>
        <span
          className={i.pasoSub}
        >{`${quien} · ${diaDe(s.at)} · ${nombreCategoria(s.categoria)}`}</span>
        <span className={p.encabezadoSolicitud}>
          <span>{s.concepto}</span>
          <span>{formatMoney(s.monto)}</span>
        </span>
        <OtroMontoForm
          id={s.id}
          vista={vista}
          pidio={String(s.monto)}
          quien={quien}
          mes={mesDe(c)}
        />
      </div>
    </Cajon>
  );
}

export function Paneles(props: Props) {
  const { panel, c, d, founderId, vista } = props;
  const preparar = trimestreParaPreparar(c);
  if (panel === 'preparar' && preparar !== null) {
    return <Preparar c={c} d={d} vista={vista} founderId={founderId} trimestre={preparar} />;
  }
  if (panel === 'aprobar' && c.pendiente !== null && c.pendiente.preparadoPor !== founderId) {
    return <Aprobar c={c} d={d} vista={vista} pendiente={c.pendiente} />;
  }
  if (panel === 'pedir') {
    const otro = otroSocio(d.socios, founderId);
    return (
      <Cajon
        eyebrow={eyebrowMes(c)}
        titulo="Pedir un gasto fuera del presupuesto"
        sub="Si cabe en lo que te queda del Límite este mes, se aprueba solo. Si no, lo aprueba el otro socio."
        cerrar={hrefPresupuesto(vista)}
      >
        <PedirForm
          vista={vista}
          limite={String(c.limite)}
          usado={String(usadoDelLimite(d.solicitudes, founderId, c.mes))}
          otro={otro}
          mes={mesDe(c)}
        />
      </Cajon>
    );
  }
  const s = d.solicitudes.find((x) => x.id === props.solicitud);
  if (
    panel === 'otro' &&
    s !== undefined &&
    estadoDeSolicitud(s) === 'pendiente' &&
    s.founderId !== founderId
  ) {
    return <OtroMonto c={c} d={d} vista={vista} id={s.id} />;
  }
  return null;
}
