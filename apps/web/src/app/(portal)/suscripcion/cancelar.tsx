'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Banner } from '@/components';
import {
  cancelarSuscripcion,
  seguirConMiPlan,
  type CancelActionResult,
} from '@/server/billing/actions';

import { fechaLarga } from './fecha';
import { btn, errorTexto, lleno } from './suscripcion.css';
import * as s from './suscripcion.css';

/**
 * Cancel and resume on Plan y pagos (SbPlan, LFPC 76 Bis, ADR-132). One tap,
 * no «¿seguro?»: the plan ends at the end of the paid period. The page then
 * re-reads the row, so the hero shows «Se cancela» and «Seguir con mi plan».
 */
function useAccion(accion: () => Promise<CancelActionResult>) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState(false);
  const [pending, startTransition] = useTransition();
  const run = () =>
    startTransition(async () => {
      const r = await accion();
      if (!r.ok) return setError(r.message);
      setError(null);
      setHecho(true);
      router.refresh();
    });
  return { error, hecho, pending, run };
}

function Cancelado({ cancelAt }: { readonly cancelAt: string }) {
  return (
    <section className={s.pausa} aria-label="Cancelación">
      <Banner
        tone="success"
        title="Listo, cancelaste tu suscripción."
        body={`Tu plan termina el ${fechaLarga(cancelAt)} y no se te cobrará más. Te mandamos la confirmación a tu correo. ¿Cambiaste de idea? Usa «Seguir con mi plan» arriba.`}
      />
    </section>
  );
}

/** The row at the bottom of the page: replaces «¿Quieres pausar tu suscripción?». */
export function CancelarRow(props: {
  readonly planNombre: string;
  readonly finPeriodo: string | null;
  /** When the subscription ends; `null` while it renews. */
  readonly cancelAt: string | null;
}) {
  const a = useAccion(cancelarSuscripcion);
  if (props.cancelAt !== null) return a.hecho ? <Cancelado cancelAt={props.cancelAt} /> : null;
  return (
    <section className={s.pausa} aria-labelledby="cancel-t">
      {a.error === null ? null : <Banner tone="critical" title={a.error} />}
      <span className={s.pausaTexto}>
        <h2 id="cancel-t" className={s.pausaTitulo}>
          ¿Quieres cancelar tu suscripción?
        </h2>
        <span className={s.nota}>
          Sigues con {props.planNombre} hasta el {fechaLarga(props.finPeriodo)} y ya no se te cobra.
          Después pasas a Xangarrito, gratis, con todos tus registros.
        </span>
      </span>
      <button
        type="button"
        className={btn.peligro}
        disabled={a.pending}
        aria-busy={a.pending}
        onClick={a.run}
        data-testid="cancelar-suscripcion"
      >
        {a.pending
          ? 'Cancelando…'
          : a.error === null
            ? 'Cancelar suscripción'
            : 'Intentar otra vez'}
      </button>
    </section>
  );
}

/** The hero's «Seguir con mi plan» while a cancellation is pending. */
export function SeguirBoton() {
  const a = useAccion(seguirConMiPlan);
  return (
    <>
      <button
        type="button"
        className={`${btn.oscuro} ${lleno}`}
        disabled={a.pending}
        aria-busy={a.pending}
        onClick={a.run}
        data-testid="seguir-con-mi-plan"
      >
        {a.pending ? 'Un momento…' : 'Seguir con mi plan'}
      </button>
      {a.error === null ? null : (
        <p role="alert" className={errorTexto}>
          {a.error}
        </p>
      )}
    </>
  );
}
