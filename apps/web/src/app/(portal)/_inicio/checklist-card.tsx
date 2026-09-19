'use client';

import type { Checklist, ChecklistItem } from '@/onboarding/checklist';
import { ICON } from '@/onboarding/ui/icons';
import { link, list, note, row, rowTitle } from '@/onboarding/ui/onboarding.css';
import { Card, Tag } from '@/components';
import { Icon } from '@/shell/icon';

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

/**
 * The «¿Cómo empiezo?» card beside the hero (P-13). The same items
 * `/como-empiezo` renders, so the portal never shows two checklists that can
 * disagree — this is a window onto that page, with its own link out.
 */
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
        {checklist.complete
          ? '¡Todo listo! Tu negocio ya está andando.'
          : `${checklist.done} de ${checklist.total} listos.`}
      </p>
      <ul className={list} data-testid="inicio-checklist">
        {checklist.items.map((item) => (
          <Item key={item.key} item={item} />
        ))}
      </ul>
    </Card>
  );
}
