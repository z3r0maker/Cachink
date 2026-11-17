import type { Route } from 'next';
import Link from 'next/link';

import { hoyEnMexico } from '@/server/db/corp';
import { cuadreDe } from '@/server/empresa/balance-cuadre-view';
import { leerBalance } from '@/server/empresa/balance-lectura';
import {
  fechaDelBalance,
  hrefBalance,
  ladosDe,
  parseVistaBalance,
  type VistaBalance,
} from '@/server/empresa/balance-view';
import { fechaCorta, fechaLarga } from '@/server/empresa/fechas';
import { mesesVecinos } from '@/server/empresa/movimiento-view';
import { requireFounderPage } from '@/server/founder';
import * as m from '@/styles/mostrador.css';

import { EncabezadoSeccion } from '../encabezado-seccion';
import { Cuadre, SinMovimientos } from './cuadre';
import { Lados } from './lados';
import { Socios } from './socios';

export const dynamic = 'force-dynamic';

function Encabezado({ v }: { readonly v: VistaBalance }) {
  const { anterior, siguiente } = mesesVecinos(v.mes);
  return (
    <EncabezadoSeccion actual="/empresa/balance" sub={fechaDelBalance(v)}>
      <div className={m.row}>
        <Link
          className={m.boton.quieto}
          href={hrefBalance(v, { mes: anterior, abrir: null }) as Route}
        >
          Mes anterior
        </Link>
        {v.esMesActual ? null : (
          <Link
            className={m.boton.quieto}
            href={hrefBalance(v, { mes: siguiente, abrir: null }) as Route}
          >
            Mes siguiente
          </Link>
        )}
      </div>
    </EncabezadoSeccion>
  );
}

/**
 * Balance (E-12, board CD-08), Resultados' second tab: what the company has,
 * owes, and what its partners put in and earned, at a month's last day (today
 * in this month) against the previous month's, checked against itself.
 */
export default async function BalancePage(props: {
  searchParams: Promise<{ mes?: string; abrir?: string }>;
}) {
  await requireFounderPage();
  const v = parseVistaBalance(await props.searchParams, hoyEnMexico());
  const datos = await leerBalance(v);
  if (datos.actual.vacio) {
    return (
      <div className={m.page}>
        <Encabezado v={v} />
        <SinMovimientos dia={fechaLarga(v.hasta)} />
      </div>
    );
  }
  return (
    <div className={m.page}>
      <Encabezado v={v} />
      <Cuadre c={cuadreDe(datos.actual, datos.desconocida)} />
      <Lados
        lados={ladosDe(datos.actual, datos.anterior, v)}
        columnas={[fechaCorta(v.hasta), fechaCorta(v.hastaAnterior)]}
        abiertos={datos.abiertos}
      />
      <Socios filas={datos.socios} />
    </div>
  );
}
