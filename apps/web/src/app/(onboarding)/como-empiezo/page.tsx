import { buildChecklist, type ChecklistItem } from '@/onboarding/checklist';
import { ICON } from '@/onboarding/ui/icons';
import { LoadFailed, OnboardingFrame, Progress } from '@/onboarding/ui/frame';
import { actions, link, list, note, row, rowTitle } from '@/onboarding/ui/onboarding.css';
import { Card, Tag } from '@/components';
import { requireSession } from '@/server/auth';
import { reportError } from '@/server/observability/report';
import { loadChecklistSignals } from '@/server/onboarding/load';
import { Icon } from '@/shell/icon';

/**
 * `/como-empiezo` — "¿Cómo empiezo?" (P-04's checklist as N-14 updates it).
 * Every item is detected from data, so it flips by itself when the owner
 * does the thing. The re-run of the wizard (N-15) starts here too.
 */
export const dynamic = 'force-dynamic';

function Item({ item }: { readonly item: ChecklistItem }) {
  return (
    <li className={row} data-done={item.done}>
      <Icon
        path={item.done ? ICON.check : ICON.clock}
        size={22}
        title={item.done ? 'Listo' : 'Pendiente'}
      />
      <span style={{ flex: 1 }}>
        {item.href !== null && !item.done ? (
          <a className={`${rowTitle} ${link}`} href={item.href}>
            {item.title}
          </a>
        ) : (
          <span className={rowTitle}>{item.title}</span>
        )}
        <span className={note}>{item.hint}</span>
      </span>
      {item.done ? <Tag tone="success">Listo</Tag> : null}
    </li>
  );
}

export default async function ComoEmpiezoPage() {
  const session = await requireSession();
  const signals = await loadChecklistSignals(session.business_id).catch((error: unknown) => {
    reportError(error, { endpoint: 'como-empiezo', businessId: session.business_id });
    return null;
  });
  if (signals === null) return <LoadFailed retry="/como-empiezo" />;
  const c = buildChecklist(signals);
  return (
    <OnboardingFrame
      title="¿Cómo empiezo?"
      subtitle={
        c.complete
          ? '¡Todo listo! Tu negocio ya está andando.'
          : 'Seis pasos para vender con Xangarro.'
      }
    >
      <Progress value={c.done} max={c.total} label={`${c.done} de ${c.total} listos`} />
      <Card>
        <ul className={list} data-testid="checklist">
          {c.items.map((item) => (
            <Item key={item.key} item={item} />
          ))}
        </ul>
      </Card>
      <div className={actions}>
        <a className={link} href="/">
          Ir a mi portal
        </a>
        <a className={link} href="/bienvenida?modo=reconfigurar">
          Volver a configurar mi negocio
        </a>
      </div>
    </OnboardingFrame>
  );
}
