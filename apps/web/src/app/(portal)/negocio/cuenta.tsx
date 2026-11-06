import Link from 'next/link';

import { DescargarTodo } from './descargar-todo';
import * as c from './cuenta.css';
import { compactaSub, compactaTexto } from './negocio.css';

/**
 * The bottom of Mi negocio, owner only (ElNegocio, ADR-136): «Descargar todo»
 * and «¿Quieres eliminar tu cuenta?». They replace «Archivar negocio»: the
 * deletion's 30-day lock does what archiving did, with an undo.
 */
export function CuentaFilas() {
  return (
    <>
      <section className={c.primera} aria-labelledby="negocio-descargar">
        <span className={compactaTexto}>
          <h2 id="negocio-descargar" className={c.titulo}>
            Descarga todos tus datos
          </h2>
          <span className={compactaSub}>
            Un .zip con el Excel de ventas, gastos, productos, movimientos y empleados, y un archivo
            JSON con todo.
          </span>
        </span>
        <DescargarTodo />
      </section>
      <section className={c.fila} aria-labelledby="negocio-eliminar">
        <span className={compactaTexto}>
          <h2 id="negocio-eliminar" className={c.titulo}>
            ¿Quieres eliminar tu cuenta?
          </h2>
          <span className={compactaSub}>
            Se cierra hoy y se borra en 30 días, con tus negocios. Puedes arrepentirte desde el
            correo que te mandamos.
          </span>
        </span>
        <Link href="/negocio/eliminar" className={c.eliminar} data-testid="eliminar-cuenta">
          Eliminar mi cuenta
        </Link>
      </section>
    </>
  );
}
