import { buildChecklist, type Checklist, type ChecklistItem } from '@/onboarding/checklist';
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
    <li className={row} data-done={item.done} data-group={item.group}>
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

function Lista({
  titulo,
  nota,
  items,
}: {
  readonly titulo: string;
  readonly nota: string;
  readonly items: readonly ChecklistItem[];
}) {
  return (
    <Card>
      <h2 style={{ margin: '0 0 2px', fontSize: 18 }}>{titulo}</h2>
      <p className={note} style={{ marginBottom: 12 }}>
        {nota}
      </p>
      <ul className={list} data-testid={`checklist-${items[0]?.group ?? 'lista'}`}>
        {items.map((item) => (
          <Item key={item.key} item={item} />
        ))}
      </ul>
    </Card>
  );
}

function Guia({ c, pago }: { readonly c: Checklist; readonly pago?: string }) {
  return (
    <OnboardingFrame
      title="¿Cómo empiezo?"
      subtitle={
        c.complete
          ? '¡Todo listo! Tu negocio ya está andando.'
          : `${c.total} pasos para vender con Xangarro. Se marcan solos conforme los haces.`
      }
    >
      {pago === 'listo' ? (
        <p role="status" className={note}>
          Guardamos tu plan. Ahora, lo que hace falta para vender:
        </p>
      ) : null}
      <Progress value={c.done} max={c.total} label={`${c.done} de ${c.total} listos`} />
      <Lista
        titulo="Para vender"
        nota="Lo que tu negocio necesita antes de la primera venta."
        items={c.required}
      />
      <Lista
        titulo="Cuando quieras"
        nota="Opcional. El portal no te lo pide, pero te sirve."
        items={c.optional}
      />
      <div className={actions}>
        {/* P-36 D-2: the portal comes back here until «Para vender» is done — unless the owner asks it not to. */}
        <a className={link} href={c.complete ? '/' : '/api/guia/omitir'}>
          Ir a mi portal
        </a>
        <a className={link} href="/bienvenida?modo=reconfigurar">
          Volver a configurar mi negocio
        </a>
      </div>
    </OnboardingFrame>
  );
}

export default async function ComoEmpiezoPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly pago?: string }>;
}) {
  const session = await requireSession();
  const { pago } = await searchParams;
  const signals = await loadChecklistSignals(session.business_id).catch((error: unknown) => {
    reportError(error, { endpoint: 'como-empiezo', businessId: session.business_id });
    return null;
  });
  if (signals === null) return <LoadFailed retry="/como-empiezo" />;
  const c = buildChecklist(signals);
  return <Guia c={c} pago={pago} />;
}
