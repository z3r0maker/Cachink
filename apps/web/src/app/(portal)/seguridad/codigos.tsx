'use client';

import { Copy, Download, Printer } from 'lucide-react';
import { useState } from 'react';

import { Button, Drawer } from '@/components';

import * as p from '../privacidad/privacidad.css';
import { IMPRIME, zonaDeImpresion } from './imprimir.css';
import * as s from './seguridad.css';

const ARCHIVO = 'xangarro-codigos-de-recuperacion.txt';

function texto(codigos: readonly string[]): string {
  const cabeza = 'Xangarro · códigos de recuperación. Cada uno sirve una sola vez.';
  return [cabeza, '', ...codigos, ''].join('\n');
}

function descargar(codigos: readonly string[]): void {
  const url = URL.createObjectURL(new Blob([texto(codigos)], { type: 'text/plain;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: ARCHIVO });
  a.click();
  URL.revokeObjectURL(url);
}

/** Prints the codes alone: the body is marked while the dialog is up (`imprimir.css.ts`). */
function imprimir(): void {
  document.body.dataset[IMPRIME] = 'codigos';
  window.addEventListener('afterprint', () => delete document.body.dataset[IMPRIME], {
    once: true,
  });
  window.print();
}

/** Three ways to keep the codes: the clipboard, a text file, paper. */
function Guardar({ codigos }: { readonly codigos: readonly string[] }) {
  const [copiados, setCopiados] = useState(false);
  const copiar = () =>
    void navigator.clipboard.writeText(codigos.join('\n')).then(() => setCopiados(true));
  return (
    <div className={s.tres}>
      <Button variant="secondary" icon={<Copy size={16} aria-hidden="true" />} onClick={copiar}>
        {copiados ? 'Copiados' : 'Copiar'}
      </Button>
      <Button
        variant="secondary"
        icon={<Download size={16} aria-hidden="true" />}
        onClick={() => descargar(codigos)}
      >
        Descargar
      </Button>
      <Button
        variant="secondary"
        icon={<Printer size={16} aria-hidden="true" />}
        onClick={imprimir}
      >
        Imprimir
      </Button>
    </div>
  );
}

/**
 * The ten recovery codes, shown once (board SgActivar): the list, three ways
 * to keep it, and the box that says it was kept. `onGuardados` reports the box.
 */
export function Codigos(props: {
  readonly codigos: readonly string[];
  readonly guardados: boolean;
  readonly onGuardados: (value: boolean) => void;
}) {
  return (
    <>
      <p className={p.texto}>
        Si pierdes tu teléfono, entras con uno de estos códigos. Cada uno sirve una sola vez.{' '}
        <strong>No los volvemos a mostrar.</strong>
      </p>
      <ol
        className={`${s.codigos} ${zonaDeImpresion}`}
        aria-label="Códigos de recuperación"
        data-testid="codigos-de-recuperacion"
      >
        {props.codigos.map((c) => (
          <li key={c} className={s.codigo}>
            <code>{c}</code>
          </li>
        ))}
      </ol>
      <Guardar codigos={props.codigos} />
      <label className={s.casilla}>
        <input
          type="checkbox"
          className={s.casillaCaja}
          checked={props.guardados}
          onChange={(ev) => props.onGuardados(ev.target.checked)}
          data-testid="codigos-guardados"
        />
        Ya los guardé en un lugar seguro
      </label>
    </>
  );
}

/** «Generar códigos nuevos»: the same list in its own panel; the earlier ones stopped working. */
export function CodigosNuevos(props: {
  readonly codigos: readonly string[] | null;
  readonly onClose: () => void;
}) {
  const [guardados, setGuardados] = useState(false);
  const cerrar = () => {
    setGuardados(false);
    props.onClose();
  };
  return (
    <Drawer
      open={props.codigos !== null}
      onOpenChange={(open) => (open ? undefined : cerrar())}
      heading="Códigos de recuperación nuevos"
      subtitle="Los códigos anteriores ya no sirven"
      width={560}
      actions={
        <Button onClick={cerrar} disabled={!guardados} data-testid="codigos-terminar">
          Terminar
        </Button>
      }
    >
      <div className={s.panel}>
        <Codigos codigos={props.codigos ?? []} guardados={guardados} onGuardados={setGuardados} />
      </div>
    </Drawer>
  );
}
