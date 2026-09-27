'use client';

import { Button, Don } from '@/components';

import { ENVUELVE } from '../_primeros/boton';
import { dinero, fechaLarga } from '../_primeros/formato';
import { IconoCandado } from '../_primeros/iconos';
import * as p from '../_primeros/primeros.css';
import * as a from '../_primeros/aviso.css';
import * as s from './resumen.css';

/**
 * The aside (`CfgInventarioInicial`): what the count is worth, how much of
 * the catalogue it covers, the one save and the one-time warning.
 */
export function Resumen({
  total,
  fecha,
  contados,
  productos,
  mayWrite,
  pendiente,
  onGuardar,
}: {
  readonly total: bigint;
  readonly fecha: string;
  readonly contados: number;
  readonly productos: number;
  readonly mayWrite: boolean;
  readonly pendiente: boolean;
  readonly onGuardar: () => void;
}) {
  return (
    <aside className={p.aside}>
      <section className={p.hero} aria-labelledby="val-t">
        <h2 id="val-t" className={p.eyebrow}>
          Valor de tu inventario
        </h2>
        <span className={p.cifra} data-testid="valuacion-inicial">
          {dinero(total)}
        </span>
        <p className={p.texto}>al {fechaLarga(fecha) || 'día que elijas'}</p>
        <Progreso contados={contados} productos={productos} />
        {mayWrite ? (
          <Guardar pendiente={pendiente} vacio={contados === 0} onGuardar={onGuardar} />
        ) : (
          <p className={p.nota}>Solo el dueño o un administrador puede capturarlo.</p>
        )}
        <p className={p.nota}>No cuenta para tu límite de movimientos del mes.</p>
      </section>
      <DonTip />
    </aside>
  );
}

function DonTip() {
  return (
    <div className={a.donTip}>
      <Don pose="contando" size={56} />
      <p className={a.donTipTexto}>
        Cuenta lo que hay en el anaquel, no lo que crees que hay. El costo ya viene de tu catálogo.
      </p>
    </div>
  );
}

function Progreso({
  contados,
  productos,
}: {
  readonly contados: number;
  readonly productos: number;
}) {
  const faltan = productos - contados;
  const pct = productos > 0 ? Math.round((contados / productos) * 100) : 0;
  return (
    <div className={s.progreso}>
      <div className={s.progresoFila}>
        <span>Productos contados</span>
        <span className={s.numero}>
          {contados} de {productos}
        </span>
      </div>
      <span className={s.pista} aria-hidden="true">
        <span className={s.relleno} style={{ width: `${pct}%` }} />
      </span>
      <p className={p.nota}>
        {faltan === 0
          ? 'Contaste todo tu catálogo.'
          : `Te ${faltan === 1 ? 'falta 1' : `faltan ${faltan}`}. Si no tienes de alguno, déjalo en blanco.`}
      </p>
    </div>
  );
}

function Guardar({
  pendiente,
  vacio,
  onGuardar,
}: {
  readonly pendiente: boolean;
  readonly vacio: boolean;
  readonly onGuardar: () => void;
}) {
  return (
    <>
      <Button
        variant="primary"
        size="lg"
        full
        style={ENVUELVE}
        disabled={pendiente || vacio}
        onClick={onGuardar}
      >
        {pendiente ? 'Guardando…' : 'Guardar inventario inicial'}
      </Button>
      <div className={s.candado}>
        <IconoCandado />
        <p className={s.candadoTexto}>
          Después ya no se edita: los cambios se hacen con entradas y mermas.
        </p>
      </div>
    </>
  );
}
