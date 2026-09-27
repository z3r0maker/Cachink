'use client';

import { IconoCheck } from '../suscripcion/iconos';
import { RechazoCard } from './rechazo-card';
import { tituloDe, type Rechazo } from './rechazo-texto';
import * as s from './sincronizacion.css';
import type { Item } from './use-rechazos';

/**
 * «Por revisar» (P-11): what a caja sent that did not enter. Refused rows are
 * never dropped; resolving one is saved, and a refused retry reopens it.
 * Owner and admin resolve; Solo lectura reads, and the action refuses anyway.
 */
function Listo({ r }: { readonly r: Rechazo }) {
  return (
    <div className={`${s.listo} ${s.fade}`} role="status">
      <span className={s.listoIcono}>
        <IconoCheck size={18} grosor={2.6} />
      </span>
      <span>Listo: marcaste «{tituloDe(r)}» como resuelto.</span>
    </div>
  );
}

export function PorRevisar(props: {
  readonly items: readonly Item[];
  readonly mayWrite: boolean;
  readonly resolver: (r: Rechazo) => Promise<string | null>;
}) {
  const primero = props.items.find((i) => !i.hecho)?.r.id;
  return (
    <section className={s.columna} aria-labelledby="por-revisar">
      <div className={s.colHead}>
        <h2 id="por-revisar" className={s.eyebrow}>
          Por revisar
        </h2>
        <span className={s.nota}>
          Si una caja lo vuelve a mandar y otra vez no entra, regresa aquí.
        </span>
      </div>
      {props.items.length === 0 ? (
        <p className={s.vacio}>No hay nada por revisar. Todo lo que mandaron tus cajas entró.</p>
      ) : null}
      {props.items.map(({ r, hecho }) =>
        hecho ? (
          <Listo key={r.id} r={r} />
        ) : (
          <RechazoCard
            key={r.id}
            r={r}
            abierto={r.id === primero}
            mayWrite={props.mayWrite}
            onResolver={() => props.resolver(r)}
          />
        ),
      )}
    </section>
  );
}
