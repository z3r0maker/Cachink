import { hoyEnMexico } from '@/server/db/corp';
import { leerLibro } from '@/server/empresa/corporativo-lectura';
import { beneficiario } from '@/server/empresa/corporativo-view';
import { requireFounderPage } from '@/server/founder';
import * as m from '@/styles/mostrador.css';
import * as s from '@/styles/mostrador-socios.css';

import { Actas, Firmas, Registros, SociosYAcciones } from './secciones';

export const dynamic = 'force-dynamic';

/**
 * Libro corporativo (E-06, board CD-05 Corporativo): partners and shares as
 * the hero, the registries and paperwork, the company's papers, and the
 * certificates' expiries. All of it read from corp.
 */
export default async function CorporativoPage() {
  await requireFounderPage();
  const hoy = hoyEnMexico();
  const libro = await leerLibro();
  return (
    <div className={m.page}>
      <header className={m.head}>
        <div className={m.headText}>
          <span className={m.eyebrow}>MEXIA, S.A.S. · RESICO persona moral</span>
          <h1 className={m.title}>Libro corporativo</h1>
        </div>
      </header>
      <SociosYAcciones libro={libro} beneficiario={beneficiario(libro.avisos, hoy).texto} />
      <Registros registros={libro.registros} />
      <div className={s.grid2}>
        <Actas docs={libro.actas} />
        <Firmas certs={libro.certificados} hoy={hoy} />
      </div>
    </div>
  );
}
