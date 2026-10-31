import { PageTabs } from '@/components/page-tabs';
import { type EmpresaHref, entryOf } from '@/shell/empresa-nav';
import * as m from '@/styles/mostrador.css';

/**
 * The header of a screen that is one tab of a rail entry (plan §2, board
 * «Cumplimiento» of canvas «Ronda 7 · Navegación»): the entry's name as the
 * title and its tabs under it. `children` are the screen's own actions.
 */
export function EncabezadoSeccion(props: {
  readonly actual: EmpresaHref;
  readonly children?: React.ReactNode;
}) {
  const entry = entryOf(props.actual);
  const label = entry?.label ?? 'Empresa';
  return (
    <header className={m.head}>
      <div className={m.headText}>
        <span className={m.eyebrow}>MEXIA · Empresa</span>
        <h1 className={m.title}>{label}</h1>
        <PageTabs label={`Secciones de ${label}`} tabs={entry?.tabs ?? []} actual={props.actual} />
      </div>
      {props.children}
    </header>
  );
}
