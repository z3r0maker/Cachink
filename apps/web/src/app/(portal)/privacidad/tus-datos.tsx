import Link from 'next/link';

import { button } from '@/components/button.css';

import { DescargarTodo } from '../negocio/descargar-todo';
import * as s from './privacidad.css';

/**
 * «Tus datos» and «¿Quieres retirar tu consentimiento?» (ADR-137). Download and
 * delete are the owner's; an ARCO request is everyone's.
 */
const SOLICITUD = '/privacidad/solicitud';

function Fila(props: {
  readonly titulo: string;
  readonly sub: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className={s.fila}>
      <span className={s.filaTexto}>
        <span className={s.filaTitulo}>{props.titulo}</span>
        <span className={s.sub}>{props.sub}</span>
      </span>
      {props.children}
    </div>
  );
}

export function TusDatos({ dueno }: { readonly dueno: boolean }) {
  return (
    <section className={s.tarjeta} aria-labelledby="pv-datos">
      <h2 id="pv-datos" className={s.ceja}>
        Tus datos
      </h2>
      {dueno ? (
        <Fila
          titulo="Descargar todo"
          sub="Un .zip por negocio, con Excel y JSON. Es tu derecho de acceso, al momento."
        >
          <DescargarTodo />
        </Fila>
      ) : null}
      <Fila
        titulo="Hacer una solicitud"
        sub="Acceso, rectificación, cancelación u oposición. Te respondemos en 20 días hábiles."
      >
        <Link href={SOLICITUD} className={button({ variant: 'secondary' })}>
          Hacer una solicitud
        </Link>
      </Fila>
      {dueno ? (
        <Fila
          titulo="Eliminar mi cuenta"
          sub="Se cierra hoy con tus negocios y se borra en 30 días."
        >
          <Link href="/negocio/eliminar" className={s.peligro}>
            Eliminar mi cuenta
          </Link>
        </Fila>
      ) : null}
    </section>
  );
}

export function Retirar({ dueno }: { readonly dueno: boolean }) {
  return (
    <section className={s.tarjeta} aria-labelledby="pv-retirar">
      <h2 id="pv-retirar" className={s.h2}>
        ¿Quieres retirar tu consentimiento?
      </h2>
      <p className={s.texto}>
        {dueno
          ? 'Sin las finalidades necesarias no podemos darte el servicio: retirarlas es cerrar tu cuenta. Puedes eliminarla tú mismo (se borra en 30 días) o pedirlo con una solicitud de revocación.'
          : 'Sin las finalidades necesarias no podemos darte acceso al portal. Para retirarlas, haz una solicitud de revocación y te respondemos en 20 días hábiles.'}
      </p>
      {dueno ? (
        <Link href="/negocio/eliminar" className={s.peligro} data-testid="pv-retirar">
          Eliminar mi cuenta
        </Link>
      ) : (
        <Link
          href={SOLICITUD}
          className={button({ variant: 'secondary' })}
          data-testid="pv-retirar"
        >
          Hacer una solicitud
        </Link>
      )}
    </section>
  );
}
