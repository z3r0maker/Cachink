import { dineroDelTrimestre } from '@xangarro/application/corp';
import {
  listFounders,
  listFundingCalls,
  listPartnerEntries,
  type Founder,
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
import { filaSocio, llamadaAbierta } from '@/server/empresa/socios-view';
import { requireFounderPage } from '@/server/founder';
import * as m from '@/styles/mostrador.css';
import * as s from '@/styles/mostrador-socios.css';

import { Cierre, type CierreSocio } from './cierre';
import { Cuenta, Historial } from './cuentas';
import { Fondeo } from './fondeo';

export const dynamic = 'force-dynamic';

/** The last quarter that ended is the one whose money can be closed. */
function cierres(entries: readonly Movimiento[], trimestre: string, nombres: Nombres) {
  return ([1, 2] as const).map((socio): CierreSocio => {
    const { adicional, previo } = dineroDelTrimestre(entries, trimestre, socio);
    return {
      socio,
      nombre: nombres[socio],
      adicional,
      cerrado:
        previo === null ? null : { bolsa: adicional - previo.prestamo, prestamo: previo.prestamo },
    };
  });
}

type Nombres = Record<1 | 2, string>;

function nombresDe(founders: readonly Founder[]): Nombres {
  const nombres: Nombres = { 1: 'Fundador 1', 2: 'Fundador 2' };
  for (const f of founders) nombres[f.numero] = `Fundador ${f.numero} · ${f.nombre}`;
  return nombres;
}

function Encabezado({ hoy }: { readonly hoy: string }) {
  return (
    <header className={m.head}>
      <div className={m.headText}>
        <span className={m.eyebrow}>MEXIA · Empresa</span>
        <h1 className={m.title}>Cuentas de socios</h1>
        <p className={m.sub}>Al {formatDateLong(parseIsoDate(hoy))}</p>
      </div>
      <Link className={m.boton.primario} href="/empresa/movimientos/registrar?tipo=socios">
        + Movimiento de socios
      </Link>
    </header>
  );
}

/**
 * Cuentas de socios (E-03, board CD-04): the open funding call, each
 * partner's capital, halves, additional money and loans, the last quarter's
 * money close, and the history. All of it read from the ledger.
 */
export default async function SociosPage() {
  await requireFounderPage();
  const db = requireCorpDb();
  const hoy = hoyEnMexico();
  const [founders, entries, calls] = await Promise.all([
    listFounders(db),
    listPartnerEntries(db),
    listFundingCalls(db),
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
          socios={cierres(entries, anterior, nombres)}
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
