import { nombreTrimestre } from '@xangarro/domain/corp';
import type { Route } from 'next';
import Link from 'next/link';

import { hoyEnMexico } from '@/server/db/corp';
import { nombreMes } from '@/server/empresa/fechas';
import { calculoDe } from '@/server/empresa/presupuesto-calculo';
import { encabezadoDe, type Aviso } from '@/server/empresa/presupuesto-encabezado';
import { fueraDe, limiteDe } from '@/server/empresa/presupuesto-fuera';
import { leerPresupuesto } from '@/server/empresa/presupuesto-lectura';
import {
  hrefPresupuesto,
  parsePanelPresupuesto,
  parseVista,
  type VistaPresupuesto,
} from '@/server/empresa/presupuesto-view';
import { requireFounderPage } from '@/server/founder';
import * as c from '@/styles/mostrador-caja.css';
import * as i from '@/styles/mostrador-impuestos.css';
import * as m from '@/styles/mostrador.css';

import { EncabezadoSeccion } from '../encabezado-seccion';
import { Fuera, Limite } from './abajo';
import { Paneles } from './paneles';
import { Tablero, Vacio } from './tablero';

export const dynamic = 'force-dynamic';

function Vistas(props: {
  readonly vista: VistaPresupuesto;
  readonly mes: string;
  readonly trimestre: string;
}) {
  const nombre = nombreMes(props.mes);
  return (
    <nav className={m.row} aria-label="Periodo">
      <Link
        className={m.chip}
        href={hrefPresupuesto('mes') as Route}
        aria-current={props.vista === 'mes'}
      >
        {`${nombre.charAt(0).toUpperCase()}${nombre.slice(1)}`}
      </Link>
      <Link
        className={m.chip}
        href={hrefPresupuesto('trimestre') as Route}
        aria-current={props.vista === 'trimestre'}
      >
        {`${nombreTrimestre(props.trimestre)} completo`}
      </Link>
    </nav>
  );
}

function AvisoPresupuesto({ aviso }: { readonly aviso: Aviso }) {
  return (
    <div className={i.aviso} role="status" data-testid="presupuesto-aviso">
      <span>
        <span className={i.pasoTitulo}>{aviso.titulo}</span>
        <span className={i.pasoSub}>{aviso.texto}</span>
      </span>
      {aviso.href === null ? null : (
        <Link className={m.boton.primario} href={aviso.href as Route}>
          Revisar y aprobar
        </Link>
      )}
    </div>
  );
}

/**
 * Presupuesto (E-22, boards CD-15d and CD-15e), Resultados' fourth tab: this
 * month or the whole quarter (`?vista=trimestre`) against its approved
 * budget by category, each founder's Límite, and the spending outside the
 * budget. The panels open with `?panel=`.
 */
export default async function PresupuestoPage(props: {
  searchParams: Promise<{ vista?: string; panel?: string; solicitud?: string }>;
}) {
  const { founder } = await requireFounderPage();
  const sp = await props.searchParams;
  const vista = parseVista(sp.vista);
  const d = await leerPresupuesto(hoyEnMexico());
  const calc = calculoDe(d);
  const enc = encabezadoDe(calc, d.socios, founder.id, vista);
  return (
    <div className={m.page}>
      <EncabezadoSeccion actual="/empresa/presupuesto" sub={enc.sub}>
        <Vistas vista={vista} mes={calc.mes} trimestre={calc.trimestre} />
      </EncabezadoSeccion>
      {enc.aviso === null ? null : <AvisoPresupuesto aviso={enc.aviso} />}
      {calc.vigente === null ? (
        <Vacio enc={enc} />
      ) : (
        <Tablero c={calc} p={calc.vigente} d={d} enc={enc} vista={vista} />
      )}
      <div className={c.paneles}>
        <Limite l={limiteDe(calc, d.solicitudes, d.socios, founder.id)} />
        <Fuera f={fueraDe(calc, d.solicitudes, d.socios, founder.id, vista)} vista={vista} />
      </div>
      <Paneles
        panel={parsePanelPresupuesto(sp.panel)}
        solicitud={sp.solicitud ?? null}
        vista={vista}
        c={calc}
        d={d}
        founderId={founder.id}
      />
    </div>
  );
}
