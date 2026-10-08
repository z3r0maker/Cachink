import { listFounders, listProjects, type Founder, type Project } from '@xangarro/data-corp';

import { corpDb } from '@/server/db/corp';
import { requireFounderPage } from '@/server/founder';
import * as u from '@/styles/torre.css';

export const dynamic = 'force-dynamic';

function Socios({ socios, yo }: { readonly socios: readonly Founder[]; readonly yo: string }) {
  return (
    <section className={u.panel} aria-labelledby="socios">
      <div className={u.panelHead}>
        <h2 id="socios" className={u.panelTitle}>
          Socios
        </h2>
      </div>
      <ul className={u.list}>
        {socios.map((s) => (
          <li key={s.id} className={u.row}>
            <span className={u.rowTitle}>
              Fundador {s.numero} · {s.nombre}
              {s.id === yo ? ' (tú)' : ''}
            </span>
            <span className={u.rowDetail}>{s.rfc ?? 'RFC sin capturar'}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Proyectos({ proyectos }: { readonly proyectos: readonly Project[] }) {
  return (
    <section className={u.panel} aria-labelledby="proyectos">
      <div className={u.panelHead}>
        <h2 id="proyectos" className={u.panelTitle}>
          Proyectos
        </h2>
      </div>
      {proyectos.length === 0 ? (
        <p className={u.rowDetail}>Todavía no hay proyectos.</p>
      ) : (
        <ul className={u.list}>
          {proyectos.map((p) => (
            <li key={p.id} className={u.row}>
              <span className={u.rowTitle}>{p.nombre}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Libro corporativo, first slice (E-01): who the partners are and which
 * projects MEXIA runs, read from corp. E-06 adds registries, actas and
 * certificates on the approved board (CD-05).
 */
export default async function CorporativoPage() {
  const { founder } = await requireFounderPage();
  const db = corpDb();
  if (db === null) throw new Error('CORP_DATABASE_URL is not set.');
  const [socios, proyectos] = await Promise.all([listFounders(db), listProjects(db)]);
  return (
    <div className={u.page}>
      <header className={u.pageHead}>
        <div>
          <span className={u.eyebrow}>MEXIA, S.A.S. · Empresa</span>
          <h1 className={u.title}>Libro corporativo</h1>
        </div>
      </header>
      <Socios socios={socios} yo={founder.id} />
      <Proyectos proyectos={proyectos} />
    </div>
  );
}
