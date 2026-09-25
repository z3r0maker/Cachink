'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Icon, NAV_ICONS, SEARCH_ICON } from './icons';
import { NAV_ITEMS } from './nav-items';
import * as s from './palette.css';

interface Option {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
  readonly icon: string;
  readonly href: string;
}

export function optionsFor(query: string): Option[] {
  const q = query.trim();
  const lower = q.toLowerCase();
  const places = NAV_ITEMS.filter(
    (i) => lower === '' || `${i.label} ${i.summary}`.toLowerCase().includes(lower),
  ).map((i) => ({
    id: i.href,
    label: i.label,
    hint: i.href,
    icon: NAV_ICONS[i.href],
    href: i.href,
  }));
  if (q === '') return places;
  const search = {
    id: 'buscar',
    label: `Buscar «${q}» en Tenants`,
    hint: 'nombre o correo',
    icon: SEARCH_ICON,
    href: `/tenants?q=${encodeURIComponent(q)}`,
  };
  return [search, ...places];
}

function useShortcut(open: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
}

function usePalette() {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const options = useMemo(() => optionsFor(query), [query]);
  const open = useCallback(() => {
    setQuery('');
    setActive(0);
    ref.current?.showModal();
  }, []);
  useShortcut(open);
  const go = (o: Option | undefined) => {
    if (o === undefined) return;
    ref.current?.close();
    router.push(o.href as Route);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') setActive((a) => Math.min(a + 1, options.length - 1));
    else if (e.key === 'ArrowUp') setActive((a) => Math.max(a - 1, 0));
    else if (e.key === 'Enter') go(options[active]);
    else return;
    e.preventDefault();
  };
  const type = (v: string) => {
    setQuery(v);
    setActive(0);
  };
  return { ref, query, type, active, setActive, options, open, go, onKeyDown };
}

type Palette = ReturnType<typeof usePalette>;

function Results({ p }: { readonly p: Palette }) {
  return (
    <div className={s.group} role="listbox" id="palette-options" aria-label="Resultados">
      <span className={s.groupTitle}>{p.query.trim() === '' ? 'Ir a' : 'Resultados'}</span>
      {p.options.map((o, i) => (
        <button
          key={o.id}
          id={`palette-${o.id}`}
          type="button"
          role="option"
          aria-selected={i === p.active}
          className={s.option}
          onMouseEnter={() => p.setActive(i)}
          onClick={() => p.go(o)}
        >
          <Icon d={o.icon} />
          <span className={s.optionLabel}>{o.label}</span>
          <span className={s.hint}>{o.hint}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * ⌘K / Ctrl+K from anywhere: every console page, plus a business search that
 * lands on Tenants filtered. A native `<dialog>`, so focus, Escape and the
 * backdrop behave without re-implementing them.
 */
export function CommandPalette() {
  const p = usePalette();
  const current = p.options[p.active];
  return (
    <>
      <button type="button" className={s.trigger} onClick={p.open}>
        <Icon d={SEARCH_ICON} size={14} />
        Buscar o ir a…
        <span className={s.kbd}>⌘K</span>
      </button>
      <dialog ref={p.ref} className={s.dialog} aria-label="Ir a o buscar">
        <div className={s.searchRow}>
          <Icon d={SEARCH_ICON} size={20} />
          <input
            className={s.search}
            aria-label="Negocio, correo o página"
            placeholder="Negocio, correo o página…"
            value={p.query}
            onChange={(e) => p.type(e.target.value)}
            onKeyDown={p.onKeyDown}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-options"
            aria-activedescendant={current ? `palette-${current.id}` : undefined}
          />
          <span className={s.kbd}>esc</span>
        </div>
        <Results p={p} />
        <div className={s.footer}>
          <span>↑↓ moverse</span>
          <span>↵ abrir</span>
          <span>esc cerrar</span>
        </div>
      </dialog>
    </>
  );
}
