import { pasosDelCierre, pasosPendientes } from '@xangarro/domain/corp';
import type { Route } from 'next';
import Link from 'next/link';

import { hoyEnMexico } from '@/server/db/corp';
import { encabezadoDe } from '@/server/empresa/cierre-encabezado';
import { historialDe } from '@/server/empresa/cierre-historial';
import { leerCierre } from '@/server/empresa/cierre-lectura';
import { leerContador } from '@/server/empresa/contador-lectura';
import { vistaDelPaquete } from '@/server/empresa/contador-view';
import { pasosVista } from '@/server/empresa/cierre-pasos';
import { fuentesDe, hrefCierre, parseMesCierre, parsePanel } from '@/server/empresa/cierre-view';
import { nombreMes } from '@/server/empresa/fechas';
import { mesesVecinos } from '@/server/empresa/movimiento-view';
import { requireFounderPage } from '@/server/founder';
import * as m from '@/styles/mostrador.css';

import { EncabezadoSeccion } from '../encabezado-seccion';
import { Banner } from './banner';
import { PanelContador } from './contador';
import { Historial } from './historial';
import { DelMes } from './mes';
import { Paneles } from './paneles';

export const dynamic = 'force-dynamic';

function Encabezado({
  mes,
  hoy,
  sub,
}: {
  readonly mes: string;
  readonly hoy: string;
  readonly sub: string;
}) {
  const { anterior, siguiente } = mesesVecinos(mes);
  return (
    <EncabezadoSeccion actual="/empresa/cierre" sub={sub}>
      <div className={m.row}>
        <Link className={m.boton.quieto} href={hrefCierre(anterior) as Route}>
          Mes anterior
        </Link>
        {mes >= hoy.slice(0, 7) ? null : (
          <Link className={m.boton.quieto} href={hrefCierre(siguiente) as Route}>
            Mes siguiente
          </Link>
        )}
      </div>
    </EncabezadoSeccion>
  );
}

function subDe(mes: string, cerrados: ReadonlySet<string>): string {
  const nombre = nombreMes(mes);
  const anterior = mesesVecinos(mes).anterior;
  const estado = cerrados.has(anterior) ? ` · ${nombreMes(anterior)} ya está cerrado` : '';
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} de ${mes.slice(0, 4)}${estado}`;
}

/**
 * Cierre del mes (E-14, board CD-10), Cumplimiento's second tab: the month's
 * seven steps, each read off the console; «Cerrar» once they are done; the
 * two-founder reopening; and the year's months with their history. The
 * panels of board CD-10b, and the contador's package (CD-10d), open with
 * `?panel=`.
 */
export default async function CierrePage(props: {
  searchParams: Promise<{ mes?: string; panel?: string }>;
}) {
  const { founder } = await requireFounderPage();
  const sp = await props.searchParams;
  const hoy = hoyEnMexico();
  const mes = parseMesCierre(sp.mes, hoy);
  const datos = await leerCierre(mes, hoy);
  const pasos = pasosDelCierre(fuentesDe(datos.detalle));
  const enc = encabezadoDe(datos, pasos, founder.id);
  const panel = parsePanel(sp.panel);
  const contador =
    panel === 'contador' && enc.paqueteHref !== null
      ? vistaDelPaquete(await leerContador(datos, pasosPendientes(pasos)))
      : null;
  return (
    <div className={m.page}>
      <Encabezado mes={mes} hoy={hoy} sub={subDe(mes, datos.cerrados)} />
      {enc.pedido === null ? null : <Banner mes={mes} pedido={enc.pedido} />}
      <DelMes mes={mes} enc={enc} pasos={pasosVista(pasos, datos.detalle, mes, enc.cerrado)} />
      <Historial anio={mes.slice(0, 4)} meses={historialDe(datos)} />
      {contador === null ? null : <PanelContador mes={mes} v={contador} />}
      <Paneles panel={panel} mes={mes} founderId={founder.id} datos={datos} enc={enc} />
    </div>
  );
}
