'use client';

import { useState } from 'react';
import { colors } from '@xangarro/tokens';

import { COPY, WA, type Opcion } from '../caja/share-options';
import { Confirmacion, OpcionBoton } from '../caja/share-lado';
import * as sh from '../caja/share-dialogo.css';
import { DialogoCerrar, DialogoMostrador, DialogoTitulo } from '../ui/dialogo-mostrador';
import * as m from '../ui/mostrador.css';
import * as k from './mandar.css';

/**
 * WhatsApp with the message ready, or the message on the clipboard. No
 * Mensajes: a computer sends no SMS (OpCierreCorte). The person still
 * presses send (D2, ADR-083).
 */
function opcionesCorte(texto: string): readonly Opcion[] {
  return [
    {
      label: 'WhatsApp',
      hint: 'Se abre WhatsApp; escoges el chat y le das enviar',
      icon: WA,
      principal: true,
      tile: colors.white,
      disabled: false,
      run: () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
        return 'Se abrió WhatsApp. Escoge el chat y dale enviar.';
      },
    },
    {
      label: 'Copiar el corte',
      hint: 'Lo pegas en el chat o correo que quieras',
      icon: COPY,
      principal: false,
      tile: colors.gray100,
      disabled: false,
      run: () =>
        navigator.clipboard.writeText(texto).then(
          () => 'Copiado. Pégalo en el chat o correo que quieras.',
          () => 'No se pudo copiar. Selecciona el mensaje y cópialo.',
        ),
    },
  ];
}

function Cabeza() {
  return (
    <div className={sh.cabeza}>
      <span className={sh.titulos}>
        <span className={m.eyebrow}>Corte de caja</span>
        <DialogoTitulo className={sh.titulo}>Mandar el corte a los patrones</DialogoTitulo>
      </span>
      <span className={sh.cerrar}>
        <DialogoCerrar label="Cerrar" />
      </span>
    </div>
  );
}

/** «Mandar el corte a los patrones» (OpCierreCorte, P-43): the corte as it arrives, then how. */
export function Mandar(p: {
  readonly open: boolean;
  readonly texto: string;
  readonly onClose: () => void;
}) {
  const [hecho, setHecho] = useState<string | null>(null);
  const cerrar = (): void => {
    setHecho(null);
    p.onClose();
  };
  return (
    <DialogoMostrador open={p.open} onClose={cerrar} width={560}>
      <Cabeza />
      <div className={k.cuerpo}>
        <span id="corte-muestra" className={m.eyebrow}>
          Así les llega
        </span>
        <p className={k.mensaje} aria-labelledby="corte-muestra" data-testid="corte-mensaje">
          {p.texto}
        </p>
        {opcionesCorte(p.texto).map((o) => (
          <OpcionBoton key={o.label} o={o} onDone={setHecho} />
        ))}
        {hecho ? <Confirmacion texto={hecho} /> : null}
      </div>
      <div className={sh.pie}>
        <button type="button" className={`${m.boton.secundario} ${k.listo}`} onClick={cerrar}>
          Listo
        </button>
      </div>
    </DialogoMostrador>
  );
}
