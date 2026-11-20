'use client';

import Link from 'next/link';
import type { KeyboardEvent } from 'react';

import { Button, Input } from '@/components';
import { button } from '@/components/button.css';

import * as s from './codigo-barras.css';

/** The live product that already has the code (`codigoEnUso`). */
export interface CodigoOcupado {
  readonly id: string;
  readonly nombre: string;
}

/**
 * «Código de barras» (P-44, ADR-150; board EcPortalCodigo), in «Nuevo
 * producto» and the edit drawer. A USB or Bluetooth reader types the code and
 * presses Enter: the Enter never saves, it says the code was read. A code
 * another product has names it, with «Ver ese producto» and «Quitar el
 * código»; UPC-A and EAN-13 count as one code (the server's `codigoCanonico`).
 */
export function CodigoBarras(p: {
  readonly value: string;
  readonly onChange: (codigo: string) => void;
  /** The reader's Enter reached the field (or the page's burst put the code here). */
  readonly leido: boolean;
  readonly onLeido: () => void;
  readonly ocupado: CodigoOcupado | null;
}) {
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    p.onLeido();
  };
  return (
    <div className={s.bloque}>
      <Input
        labelText="Código de barras"
        hintText="Opcional. Con tu lector de códigos se escribe solo; también puedes teclear los números."
        placeholder="7501234567897"
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
        onKeyDown={onKeyDown}
        autoComplete="off"
        data-testid="producto-sku"
      />
      {p.leido && p.ocupado === null ? (
        <p role="status" className={s.leido} data-testid="producto-codigo-leido">
          Leímos el código. El Enter del lector no guarda: revisa y sigue cuando quieras.
        </p>
      ) : null}
      {p.ocupado === null ? null : <Repetido ocupado={p.ocupado} onQuitar={() => p.onChange('')} />}
    </div>
  );
}

/** «Ese código ya lo tiene …», with the way to that product and the way out. */
function Repetido(p: { readonly ocupado: CodigoOcupado; readonly onQuitar: () => void }) {
  return (
    <div role="alert" className={s.repetido} data-testid="producto-codigo-repetido">
      <span className={s.repetidoTitulo}>{`Ese código ya lo tiene «${p.ocupado.nombre}».`}</span>
      <span>Un código es de un solo producto, para que la caja cobre el correcto.</span>
      <div className={s.acciones}>
        <Link
          href={`/productos?editar=${encodeURIComponent(p.ocupado.id)}`}
          className={button({ variant: 'secondary', size: 'sm' })}
        >
          Ver ese producto
        </Link>
        <Button variant="ghost" size="sm" onClick={p.onQuitar}>
          Quitar el código
        </Button>
      </div>
    </div>
  );
}
