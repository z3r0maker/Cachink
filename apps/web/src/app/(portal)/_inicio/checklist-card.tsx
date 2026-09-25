'use client';

import type { Checklist, ChecklistItem } from '@/onboarding/checklist';
import { ICON } from '@/onboarding/ui/icons';
import { link, list, note, row, rowTitle } from '@/onboarding/ui/onboarding.css';
import { Card, Tag } from '@/components';
import { Icon } from '@/shell/icon';

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

/**
 * The «¿Cómo empiezo?» card beside the hero (P-13). The same items
 * `/como-empiezo` renders, so the portal never shows two checklists that can
 * disagree — this is a window onto that page, with its own link out.
 */
/** «Para vender» drives the line; the optional list is only counted once selling is possible. */
function resumen(c: Checklist): string {
  if (!c.complete) return `${c.done} de ${c.total} listos.`;
  const pendientes = c.optional.filter((i) => !i.done).length;
  return pendientes === 0
    ? '¡Todo listo! Tu negocio ya está andando.'
    : `Listo para vender. ${pendientes} opcional${pendientes === 1 ? '' : 'es'} por hacer.`;
}

export function ChecklistCard({ checklist }: { readonly checklist: Checklist }) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
        <h3 className={rowTitle} style={{ margin: 0 }}>
          ¿Cómo empiezo?
        </h3>
        <a className={link} style={{ marginLeft: 'auto' }} href="/como-empiezo">
          Ver todo
        </a>
      </div>
      <p className={note} style={{ marginTop: 0 }}>
        {resumen(checklist)}
      </p>
      <ul className={list} data-testid="inicio-checklist">
        {checklist.items.map((item) => (
          <Item key={item.key} item={item} />
        ))}
      </ul>
    </Card>
  );
}
