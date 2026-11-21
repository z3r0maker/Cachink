import type { Guia } from './guia.js';
import { DE_CAJA, paso } from './paso.js';

/**
 * The guides about the shift itself and what goes in and out of the caja
 * besides sales. Every step is worded to be true on the phone and in the
 * browser alike: where the two label a button differently, the step names
 * what they share.
 */

export const ABRIR_TURNO: Guia = {
  ...DE_CAJA,
  id: 'abrir-turno',
  tema: 'ventas',
  titulo: 'Abrir turno',
  pantallas: ['inicio'],
  ir: { label: 'Inicio', href: 'inicio' },
  pasos: [
    paso('Toca «Abrir turno».', 'Para empezar el día, toca Abrir turno.', 'inicio-hero-accion'),
    paso(
      'Cuenta el fondo y escribe con cuánto empiezas. Si no hay, pon 0.',
      'Cuenta lo que hay para dar cambio y anótalo.',
    ),
    paso(
      'Confirma. El turno queda abierto y ya puedes cobrar.',
      'Confirma y listo. ¡A vender se ha dicho!',
      'caja-abrir-submit',
    ),
  ],
};

export const REGISTRAR_GASTO: Guia = {
  ...DE_CAJA,
  id: 'registrar-gasto',
  tema: 'ventas',
  titulo: 'Registrar un gasto',
  pantallas: ['gastos'],
  ir: { label: 'Gastos', href: 'gastos' },
  pasos: [
    paso(
      'En Gastos, toca «Registrar gasto».',
      '¿Salió dinero de la caja? Vamos a anotarlo.',
      'gastos-abrir-registrar',
    ),
    paso(
      'Escribe qué compraste y cuánto fue.',
      'Dime qué compraste y cuánto costó.',
      'gasto-concepto',
    ),
    paso('Elige la categoría.', 'Elige de qué tipo fue el gasto.', 'gasto-categoria-Insumos'),
    paso(
      'Toca «Registrar». Sale del efectivo de tu caja.',
      'Regístralo. Así tu corte cuadra al cerrar.',
      'gasto-guardar',
    ),
  ],
};

export const LLEGO_MERCANCIA: Guia = {
  ...DE_CAJA,
  id: 'llego-mercancia',
  tema: 'productos',
  titulo: 'Llegó mercancía',
  pantallas: ['inventario'],
  ir: { label: 'Inventario', href: 'inventario' },
  pasos: [
    paso(
      'En Inventario, busca el producto que llegó.',
      '¿Llegó el proveedor? Busca el producto en Inventario.',
      'mobile-inventario',
    ),
    paso(
      'Elige «Llegó mercancía» en ese producto.',
      'Tócalo y elige Llegó mercancía.',
      'mover-tipo-Entrada',
    ),
    paso('Pon cuántos llegaron.', 'Cuenta lo que llegó y pon la cantidad.', 'mover-cantidad'),
    paso(
      'Toca «Registrar entrada». Las existencias suben solas.',
      'Registra la entrada. Yo sumo las existencias.',
      'mover-guardar',
    ),
  ],
};

export const CERRAR_TURNO: Guia = {
  ...DE_CAJA,
  id: 'cerrar-turno',
  tema: 'ventas',
  titulo: 'Cerrar turno y contar la caja',
  pantallas: ['mi-turno', 'cierre'],
  ir: { label: 'Cierre de turno', href: 'cierre' },
  pasos: [
    paso(
      'Al terminar, toca «Cerrar turno».',
      '¿Ya acabaste por hoy? Toca Cerrar turno.',
      'turno-cerrar-mi-turno',
    ),
    paso(
      'Saca todo el efectivo y pon cuántos hay de cada uno.',
      'Saca el efectivo y cuenta billetes y monedas.',
    ),
    paso('Si falta o sobra, elige por qué.', 'Si no cuadra, no te apures: dime por qué.'),
    paso(
      'Toca «Cerrar turno». Queda guardado con tu nombre.',
      'Cierra el turno. ¡Buen trabajo, nos vemos mañana!',
      'cierre-cerrar-turno',
    ),
  ],
};
