'use client';

import { Don } from '@/components';
import { administrarSuscripcion } from '@/server/billing/actions';

import { BotonStripe } from './acciones';
import * as s from './suscripcion.css';

/**
 * Past due or lapsed: Don worried, the problem in one line, what happens next
 * (estadoCopy's aviso) and, for the owner, the fix: the Customer Portal for a
 * failed card, the plan cards for a lapsed subscription.
 */
export function AvisoPago(props: {
  readonly aviso: string;
  readonly tono: 'atrasado' | 'vencido';
  readonly owner: boolean;
}) {
  const vencido = props.tono === 'vencido';
  return (
    <section className={s.aviso[props.tono]} role="status" aria-labelledby="aviso-pago-t">
      <span className={s.avisoDon}>
        <Don pose="preocupado" size={58} />
      </span>
      <span className={s.avisoTexto}>
        <h2 id="aviso-pago-t" className={s.avisoTitulo}>
          Revisa tu pago
        </h2>
        <p className={s.avisoCuerpo}>{props.aviso}</p>
      </span>
      {props.owner && vencido ? (
        <a href="#planes" className={s.btn.primario}>
          Elegir un plan
        </a>
      ) : null}
      {props.owner && !vencido ? (
        <span>
          <BotonStripe
            estilo="primario"
            label="Actualizar método de pago"
            accion={() => administrarSuscripcion()}
          />
        </span>
      ) : null}
    </section>
  );
}
