import type { Route } from 'next';
import Link from 'next/link';

import { Cajon } from '@/components/cajon';
import { hoyEnMexico } from '@/server/db/corp';
import { fechaLarga, nombreMes } from '@/server/empresa/fechas';
import { valoresDeclaracion } from '@/server/empresa/impuestos-form';
import { leerImpuestos } from '@/server/empresa/impuestos-lectura';
import {
  hrefImpuestos,
  mesDe,
  parseMesImpuestos,
  sinMovimientos,
  venceEl,
} from '@/server/empresa/impuestos-view';
import { mesesVecinos } from '@/server/empresa/movimiento-view';
import { requireFounderPage } from '@/server/founder';
import * as m from '@/styles/mostrador.css';

import { EncabezadoSeccion } from '../encabezado-seccion';
import { Anteriores, SinMovimientos } from './anteriores';
import { DeclaracionForm } from './form';
import { DelMes } from './mes';

export const dynamic = 'force-dynamic';

function Encabezado({ mes, hoy }: { readonly mes: string; readonly hoy: string }) {
  const { anterior, siguiente } = mesesVecinos(mes);
  const nombre = nombreMes(mes);
  const sub = `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} de ${mes.slice(0, 4)} · se declara y se paga a más tardar el ${fechaLarga(venceEl(mes))}`;
  return (
    <EncabezadoSeccion actual="/empresa/impuestos" sub={sub}>
      <div className={m.row}>
        <Link className={m.boton.quieto} href={hrefImpuestos(anterior) as Route}>
          Mes anterior
        </Link>
        {mes >= hoy.slice(0, 7) ? null : (
          <Link className={m.boton.quieto} href={hrefImpuestos(siguiente) as Route}>
            Mes siguiente
          </Link>
        )}
      </div>
    </EncabezadoSeccion>
  );
}

/**
 * Impuestos (E-13, board CD-09), Resultados' third tab: the month's ISR, IVA
 * and withholdings as the ledger estimates them, against what the contador
 * declared, with its papers and its payment. «Capturar la declaración»
 * opens the drawer of board CD-09b.
 */
export default async function ImpuestosPage(props: {
  searchParams: Promise<{ mes?: string; declarar?: string }>;
}) {
  await requireFounderPage();
  const sp = await props.searchParams;
  const hoy = hoyEnMexico();
  const mes = parseMesImpuestos(sp.mes, hoy);
  const datos = await leerImpuestos(mes, hoy);
  const delMes = mesDe(datos, mes);
  const vacio = delMes === null || sinMovimientos(datos, delMes);
  return (
    <div className={m.page}>
      <Encabezado mes={mes} hoy={hoy} />
      {vacio || delMes === null ? (
        <SinMovimientos mes={mes} />
      ) : (
        <>
          <DelMes m={delMes} d={datos} />
          <Anteriores d={datos} />
        </>
      )}
      {sp.declarar === '1' && delMes !== null && delMes.estado !== 'pagada' ? (
        <Cajon
          eyebrow={`Impuestos · ${nombreMes(mes)} de ${mes.slice(0, 4)}`}
          titulo="Lo que declaró el contador"
          sub="Copia las cifras de su declaración. Junto a cada una está lo que sale aquí."
          cerrar={hrefImpuestos(mes)}
        >
          <DeclaracionForm v={valoresDeclaracion(delMes)} cerrar={hrefImpuestos(mes)} />
        </Cajon>
      ) : null}
    </div>
  );
}
