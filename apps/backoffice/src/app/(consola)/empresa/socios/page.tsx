import {
  aceptadoDelTrimestre,
  dineroDelTrimestre,
  type DatosDelTablero,
} from '@xangarro/application/corp';
import {
  listFounders,
  listFundingCalls,
  leerTablero,
  listPartnerEntries,
  type Movimiento,
} from '@xangarro/data-corp';
import { formatDateLong, parseIsoDate } from '@xangarro/domain';
import {
  cuentasDeSocios,
  nombreTrimestre,
  trimestreAnterior,
  trimestreDe,
} from '@xangarro/domain/corp';
import Link from 'next/link';

import { hoyEnMexico, requireCorpDb } from '@/server/db/corp';
import { filaSocio, llamadaAbierta, nombresDe, type Nombres } from '@/server/empresa/socios-view';
import { requireFounderPage } from '@/server/founder';
import * as m from '@/styles/mostrador.css';
import * as s from '@/styles/mostrador-socios.css';

import { EncabezadoSeccion } from '../encabezado-seccion';
import { Cierre, type CierreSocio } from './cierre';
import { Cuenta, Historial } from './cuentas';
import { Fondeo } from './fondeo';

export const dynamic = 'force-dynamic';

/** The last quarter that ended is the one whose money can be closed; its cap is the Tablero's. */
function cierres(
  entries: readonly Movimiento[],
  trimestre: string,
  nombres: Nombres,
  tablero: { readonly datos: DatosDelTablero; readonly hoy: string },
) {
  const t = aceptadoDelTrimestre(tablero.datos, trimestre, tablero.hoy);
  return ([1, 2] as const).map((socio): CierreSocio => {
    const { adicional, previo } = dineroDelTrimestre(entries, trimestre, socio);
    return {
      socio,
      nombre: nombres[socio],
      adicional,
      cerrado:
        previo === null ? null : { bolsa: adicional - previo.prestamo, prestamo: previo.prestamo },
      tablero: !t.cubierto ? null : t.decidido ? t.aceptado[socio] : 'espera',
    };
  });
}

function Encabezado({ hoy }: { readonly hoy: string }) {
  return (
    <EncabezadoSeccion actual="/empresa/socios" sub={`Al ${formatDateLong(parseIsoDate(hoy))}`}>
      <Link className={m.boton.primario} href="/empresa/movimientos/registrar?tipo=socios">
        + Movimiento de socios
      </Link>
    </EncabezadoSeccion>
  );
}

/**
 * Socios › Cuentas (E-03, board CD-04): the open funding call, each
 * partner's capital, halves, additional money and loans, the last quarter's
 * money close, and the history. All of it read from the ledger.
 */
export default async function SociosPage() {
  await requireFounderPage();
  const db = requireCorpDb();
  const hoy = hoyEnMexico();
  const [founders, entries, calls, datos] = await Promise.all([
    listFounders(db),
    listPartnerEntries(db),
    listFundingCalls(db),
    leerTablero(db),
  ]);
  const nombres = nombresDe(founders);
  const cuentas = cuentasDeSocios(entries);
  const anterior = trimestreAnterior(trimestreDe(hoy));
  return (
    <div className={m.page}>
      <Encabezado hoy={hoy} />
      <Fondeo call={llamadaAbierta(calls)} hoy={hoy} />
      <div className={s.grid2}>
        {founders.map((f) => (
          <Cuenta key={f.id} socio={f} cuenta={cuentas[f.numero]} />
        ))}
      </div>
      <div className={s.grid2}>
        <Cierre
          trimestre={anterior}
          nombre={nombreTrimestre(anterior)}
          socios={cierres(entries, anterior, nombres, { datos, hoy })}
        />
        <Historial
          filas={[...entries]
            .reverse()
            .slice(0, 12)
            .map((e) => filaSocio(e, nombres))}
        />
      </div>
    </div>
  );
}
