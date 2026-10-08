import { documentosDelMovimiento, getMovimiento, type Movimiento } from '@xangarro/data-corp';
import { formatMoney } from '@xangarro/domain';
import { ACCOUNTS } from '@xangarro/domain/corp';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { hoyEnMexico, requireCorpDb } from '@/server/db/corp';
import { filaDe } from '@/server/empresa/movimiento-view';
import { requireFounderPage } from '@/server/founder';
import * as d from '@/styles/mostrador-data.css';
import * as m from '@/styles/mostrador.css';

import { Comprobantes } from './comprobantes';
import { RevertirForm } from './revertir-form';

export const dynamic = 'force-dynamic';

const centavos = (v: bigint) => (v === 0n ? '' : formatMoney(v));

/** The entry as the contador reads it: account, cargo, abono. */
function Asiento({ mov }: { readonly mov: Movimiento }) {
  return (
    <section className={m.panel} aria-labelledby="asiento">
      <div className={m.pad}>
        <h2 id="asiento" className={m.tileLabel}>
          Asiento
        </h2>
      </div>
      <table className={d.table}>
        <thead>
          <tr>
            <th className={d.th} scope="col">
              Cuenta
            </th>
            <th className={d.thNum} scope="col">
              Cargo
            </th>
            <th className={d.thNum} scope="col">
              Abono
            </th>
          </tr>
        </thead>
        <tbody>
          {mov.lines.map((l, i) => (
            <tr key={i} data-testid="linea">
              <td className={d.tdStrong}>
                {ACCOUNTS[l.cuenta].nombre}
                {l.socio === undefined ? '' : ` · Fundador ${l.socio}`}
              </td>
              <td className={d.tdNum}>{centavos(l.debe)}</td>
              <td className={d.tdNum}>{centavos(l.haber)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Siguiente({ mov }: { readonly mov: Movimiento }) {
  if (mov.reversesEntryId !== null) {
    return (
      <Link className={m.boton.secundario} href={`/empresa/movimientos/${mov.reversesEntryId}`}>
        Ver el movimiento revertido
      </Link>
    );
  }
  if (mov.reversedBy !== null) {
    return (
      <Link className={m.boton.secundario} href={`/empresa/movimientos/${mov.reversedBy}`}>
        Ver la reversa
      </Link>
    );
  }
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="revertir">
      <h2 id="revertir" className={m.tileLabel}>
        ¿Está mal?
      </h2>
      <p className={m.sub}>Revierte este movimiento y registra el correcto.</p>
      <RevertirForm entryId={mov.id} hoy={hoyEnMexico()} />
    </section>
  );
}

/** A movement's detail (E-02): what was captured, its entry, and the way to undo it. */
export default async function MovimientoPage(props: { params: Promise<{ id: string }> }) {
  await requireFounderPage();
  const { id } = await props.params;
  const db = requireCorpDb();
  const [mov, docs] = await Promise.all([getMovimiento(db, id), documentosDelMovimiento(db, id)]);
  if (mov === null) notFound();
  const fila = filaDe(mov);
  return (
    <div className={m.page}>
      <header className={m.head}>
        <div className={m.headText}>
          <span className={m.eyebrow}>
            {fila.tipo} · {fila.fecha}
          </span>
          <h1 className={m.title}>{mov.concepto}</h1>
          <p className={m.sub}>{[fila.categoria, fila.detalle].filter(Boolean).join(' · ')}</p>
        </div>
        <Link className={m.boton.quieto} href={`/empresa/movimientos?mes=${mov.fecha.slice(0, 7)}`}>
          Volver al mes
        </Link>
      </header>
      <section className={m.hero} aria-label="Monto">
        <span className={m.tileLabel}>{fila.entra ? 'Entró al banco' : 'Salió del banco'}</span>
        <span className={m.tileValue} data-testid="monto">
          {fila.monto}
        </span>
        <span className={m.tileNote}>{fila.estado}</span>
      </section>
      <Asiento mov={mov} />
      <Comprobantes mov={mov} docs={docs} />
      <div>
        <Siguiente mov={mov} />
      </div>
    </div>
  );
}
