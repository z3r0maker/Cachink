'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button, DonDice, Drawer } from '@/components';
import { button } from '@/components/button.css';

import * as s from './guia.css';
import type { Guia } from './guias';

function Pasos(p: { readonly pasos: readonly string[]; readonly actual: number }) {
  return (
    <ol className={s.pasos} aria-label="Pasos">
      {p.pasos.map((texto, i) => (
        <li
          key={texto}
          className={s.paso[i < p.actual ? 'hecho' : i === p.actual ? 'actual' : 'falta']}
        >
          <span className={s.pasoNum} aria-hidden="true">
            {i < p.actual ? '✓' : i + 1}
          </span>
          <span>{texto}</span>
        </li>
      ))}
    </ol>
  );
}

function Acciones(p: {
  readonly guia: Guia;
  readonly paso: number;
  readonly ir: (n: number) => void;
}) {
  const ultimo = p.paso === p.guia.pasos.length - 1;
  return (
    <>
      {p.paso > 0 ? (
        <Button variant="ghost" onClick={() => p.ir(p.paso - 1)}>
          Atrás
        </Button>
      ) : null}
      <span className={s.empuja} />
      {ultimo ? (
        <Link href={p.guia.ir.href} className={button({ variant: 'primary' })}>
          {p.guia.ir.label}
        </Link>
      ) : (
        <Button onClick={() => p.ir(p.paso + 1)}>Siguiente</Button>
      )}
    </>
  );
}

/**
 * One of Don Cuentas's guides, a step at a time (ADR-107): he walks beside
 * it («caminando»), the steps done stay ticked, and the last one takes the
 * owner to the screen where the job is done.
 */
export function GuiaDrawer({
  guia,
  onCerrar,
}: {
  readonly guia: Guia | null;
  readonly onCerrar: () => void;
}) {
  const [paso, setPaso] = useState(0);
  useEffect(() => setPaso(0), [guia]);
  if (guia === null) return null;
  const ultimo = paso === guia.pasos.length - 1;
  return (
    <Drawer
      open
      onOpenChange={(o) => (o ? undefined : onCerrar())}
      eyebrow={`Guía · ${guia.minutos} min`}
      heading={guia.titulo}
      subtitle={`Paso ${paso + 1} de ${guia.pasos.length}`}
      description={`Guía paso a paso: ${guia.titulo}`}
      actions={<Acciones guia={guia} paso={paso} ir={setPaso} />}
    >
      <DonDice pose={ultimo ? 'senalando' : 'caminando'} size={110}>
        {guia.pasos[paso]}
      </DonDice>
      <Pasos pasos={guia.pasos} actual={paso} />
    </Drawer>
  );
}
