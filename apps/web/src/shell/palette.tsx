'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Icon } from './icon';
import { matches, type Destino } from './palette-search';
import { srOnly } from '../styles/global.css';

import * as s from './palette.css';

const SEARCH = 'm21 21-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z';

function useShortcut(setOpen: (open: boolean) => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);
}

function usePalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const router = useRouter();
  const found = useMemo(() => matches(query), [query]);
  useShortcut(setOpen);
  const go = (d: Destino | undefined) => {
    if (d === undefined) return;
    setOpen(false);
    setQuery('');
    router.push(d.item.href);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') setActive((a) => Math.min(a + 1, found.length - 1));
    else if (e.key === 'ArrowUp') setActive((a) => Math.max(a - 1, 0));
    else if (e.key === 'Enter') go(found[active]);
    else return;
    e.preventDefault();
  };
  const onQuery = (q: string) => {
    setQuery(q);
    setActive(0);
  };
  return { open, setOpen, query, onQuery, found, active, go, onKeyDown };
}

/** «Buscar o ir a…» (⌘K / Ctrl+K): every destination, by name, from anywhere. */
export function Palette() {
  const p = usePalette();
  return (
    <Dialog.Root open={p.open} onOpenChange={p.setOpen}>
      <Dialog.Trigger className={s.trigger} aria-label="Buscar o ir a">
        <Icon path={SEARCH} size={18} />
        <span className={s.triggerText}>Buscar o ir a…</span>
        <span className={s.kbd} aria-hidden="true">
          ⌘K
        </span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={s.overlay} />
        <Dialog.Content className={s.panel} aria-describedby={undefined}>
          <Dialog.Title className={srOnly}>Buscar o ir a</Dialog.Title>
          <Resultados p={p} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Resultados({ p }: { readonly p: ReturnType<typeof usePalette> }) {
  return (
    <>
      <input
        className={s.input}
        value={p.query}
        onChange={(e) => p.onQuery(e.target.value)}
        onKeyDown={p.onKeyDown}
        placeholder="¿A dónde vamos? Productos, nómina, mi plan…"
        aria-label="Buscar"
        role="combobox"
        aria-expanded="true"
        aria-controls="palette-list"
        aria-activedescendant={p.found.length > 0 ? `palette-${p.active}` : undefined}
      />
      <ul id="palette-list" role="listbox" className={s.list} aria-label="Destinos">
        {p.found.length === 0 ? (
          <li className={s.empty}>No encontré nada con ese nombre.</li>
        ) : null}
        {p.found.map((d, i) => (
          <li
            key={d.item.href}
            id={`palette-${i}`}
            role="option"
            aria-selected={i === p.active}
            className={s.option}
            onClick={() => p.go(d)}
          >
            <Icon path={d.item.icon} size={19} />
            {d.item.label}
            <span className={s.group}>{d.group}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
