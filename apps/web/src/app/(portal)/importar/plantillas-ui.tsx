'use client';

import { useRef, type KeyboardEvent } from 'react';

import type { TemplateId } from '@/server/import/templates';

import { IconoBajar, IconoPalomita } from '../_primeros/iconos';
import * as p from '../_primeros/primeros.css';
import { TEMPLATES, type TemplateMeta } from './plantillas';
import * as s from './importar.css';

/** Step 1: which sheet the business brings over, as a radio group of two cards. */
export function Plantillas({
  value,
  onPick,
}: {
  readonly value: TemplateId;
  readonly onPick: (id: TemplateId) => void;
}) {
  const grupo = useRef<HTMLDivElement>(null);
  const flechas = (e: KeyboardEvent) => {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (d === undefined) return;
    e.preventDefault();
    const i = TEMPLATES.findIndex((t) => t.id === value);
    const next = TEMPLATES[(i + d + TEMPLATES.length) % TEMPLATES.length];
    if (next === undefined) return;
    onPick(next.id);
    grupo.current?.querySelector<HTMLButtonElement>(`[data-id="${next.id}"]`)?.focus();
  };
  return (
    <div
      ref={grupo}
      role="radiogroup"
      aria-label="Qué quieres importar"
      className={s.plantillas}
      onKeyDown={flechas}
    >
      {TEMPLATES.map((t) => (
        <Tarjeta key={t.id} t={t} on={t.id === value} onPick={() => onPick(t.id)} />
      ))}
    </div>
  );
}

function Tarjeta({
  t,
  on,
  onPick,
}: {
  readonly t: TemplateMeta;
  readonly on: boolean;
  readonly onPick: () => void;
}) {
  return (
    <div className={s.plantilla} data-on={on ? '' : undefined}>
      <button
        type="button"
        role="radio"
        aria-checked={on}
        tabIndex={on ? 0 : -1}
        data-id={t.id}
        className={s.plantillaBoton}
        onClick={onPick}
      >
        <span className={s.mosaico} aria-hidden="true">
          {t.id === 'productos' ? <IconoCaja /> : <IconoGente />}
        </span>
        <span className={s.plantillaTexto}>
          <span className={s.plantillaNombre}>{t.label}</span>
          <span className={p.texto}>{t.description}</span>
        </span>
      </button>
      <Lado t={t} on={on} />
    </div>
  );
}

function Lado({ t, on }: { readonly t: TemplateMeta; readonly on: boolean }) {
  return (
    <div className={s.plantillaLado}>
      <span className={s.punto} aria-hidden="true">
        {on ? <IconoPalomita size={14} grosor={3.4} /> : null}
      </span>
      <a
        href={t.templateHref}
        download
        className={s.bajar}
        aria-label={`Descargar plantilla de ${t.label}`}
      >
        <IconoBajar />
        Descargar plantilla
      </a>
    </div>
  );
}

const TRAZO = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

function IconoCaja() {
  return (
    <svg viewBox="0 0 24 24" width={26} height={26} {...TRAZO}>
      <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73zM12 22V12M3.29 7 12 12l8.71-5M7.5 4.27l9 5.15" />
    </svg>
  );
}

function IconoGente() {
  return (
    <svg viewBox="0 0 24 24" width={26} height={26} {...TRAZO}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3.13a4 4 0 0 1 0 7.75M22 21v-2a4 4 0 0 0-3-3.87" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  );
}
