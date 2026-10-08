import { CATALOGO } from '@xangarro/domain/corp';
import { formatMonth } from '@xangarro/domain';
import Link from 'next/link';

import type { GrupoAgenda, ItemAgenda } from '@/server/empresa/agenda-view';
import * as a from '@/styles/mostrador-agenda.css';
import * as m from '@/styles/mostrador.css';
import * as s from '@/styles/mostrador-socios.css';

/** Agenda › Próximos' list and its «Exentas» panel (E-04, board CD-05). */
function Item({ i }: { readonly i: ItemAgenda }) {
  return (
    <li className={i.tarde ? `${a.item} ${a.itemLate}` : a.item} data-testid="obligacion">
      <span className={a.when}>
        <span className={a.whenDate}>{i.fecha}</span>
        <span className={i.tarde ? a.whenLeft.late : a.whenLeft.soon}>{i.falta}</span>
      </span>
      <span>
        <Link className={a.itemLink} href={i.href}>
          {i.titulo}
        </Link>
        <span className={a.itemBasis}>{i.fundamento}</span>
      </span>
      <span className={a.meta}>
        <span className={a.authority}>{i.autoridad}</span>
        <span className={a.chip[i.tono]}>{i.estado}</span>
      </span>
    </li>
  );
}

export function Proximos({ grupos }: { readonly grupos: readonly GrupoAgenda[] }) {
  if (grupos.length === 0) {
    return (
      <section className={m.panelPad}>
        <p className={m.sub}>Nada pendiente en los próximos seis meses.</p>
      </section>
    );
  }
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-label="Próximos">
      {grupos.map((g) => (
        <div key={g.label}>
          <h2
            className={`${a.groupLabel} ${g.label === 'Vencidas' ? a.groupTone.bad : a.groupTone.dim}`}
          >
            {g.label}
          </h2>
          <ul className={a.list}>
            {g.items.map((i) => (
              <Item key={i.key} i={i} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

export function Exentas() {
  const exentas = CATALOGO.filter((p) => p.exenta !== null);
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="exentas">
      <h2 id="exentas" className={s.sectionTitle}>
        Exentas
      </h2>
      {exentas.map((p) => (
        <div key={p.id} data-testid="exenta">
          <span className={a.whenDate}>{p.titulo}</span>
          <span className={a.itemBasis}>{p.exenta?.motivo}</span>
          <span className={a.authority}>
            Revisión: {p.exenta === null ? '' : formatMonth(p.exenta.revisar)}
          </span>
        </div>
      ))}
    </section>
  );
}
