'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useState } from 'react';

import { hazard, lid, lidOpen } from './flags.css';

/**
 * A kill switch's safety cover. It switches off a feature for every business
 * at once, so reaching its editor takes one deliberate extra click — the
 * editor itself still asks for the reason and writes the audit row.
 */
export function Tapa({ href, name }: { readonly href: string; readonly name: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        type="button"
        className={hazard}
        onClick={() => setOpen(true)}
        aria-label={`Levantar la tapa de ${name}`}
      >
        <span className={lid}>LEVANTAR</span>
      </button>
    );
  }
  return (
    <span className={lidOpen}>
      <Link href={href as Route}>Editar</Link>
      <button type="button" className={lid} onClick={() => setOpen(false)}>
        Bajar tapa
      </button>
    </span>
  );
}
