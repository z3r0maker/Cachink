import type { ReactNode } from 'react';

import { Card } from '@/components';

import { pila, placaTono } from '../../_publico/publico.css';
import { tituloAcceso } from '../auth-card.css';
import { cabezaTarjeta, marco } from './recuperar.css';

/**
 * The card `/login/recuperar` and `/login/restablecer` sit in: the login's
 * form card (hero card, 460px) with a glyph tile over the title.
 */
export function TarjetaAcceso(props: {
  readonly icono: ReactNode;
  readonly titulo: string;
  readonly bajada?: string;
  readonly children: ReactNode;
}) {
  return (
    <div className={marco}>
      <Card emphasis="hero">
        <div className={pila}>
          <span className={placaTono.amarilla} aria-hidden="true">
            {props.icono}
          </span>
          <div className={cabezaTarjeta}>
            <h1 className={tituloAcceso}>{props.titulo}</h1>
            {props.bajada ? <p>{props.bajada}</p> : null}
          </div>
          {props.children}
        </div>
      </Card>
    </div>
  );
}
