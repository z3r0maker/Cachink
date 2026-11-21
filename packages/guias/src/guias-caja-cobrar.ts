import type { Guia } from './guia.js';
import { DE_CAJA, paso } from './paso.js';

/**
 * The guides about a sale: charging it, charging it with the scanner, adding
 * the product that was missing, and cancelling one. Worded to be true on the
 * phone and in the browser alike, except the scanner, which only the phone has.
 */

export const COBRAR_VENTA: Guia = {
  ...DE_CAJA,
  id: 'cobrar-venta',
  tema: 'ventas',
  titulo: 'Cobrar una venta',
  pantallas: ['cobrar'],
  ir: { label: 'Cobrar', href: 'cobrar' },
  pasos: [
    paso(
      'Toca lo que pidió el cliente.',
      'Primero, toca lo que te pidieron. ¡Así de fácil!',
      'ventas-product-grid',
    ),
    paso(
      'Revisa el ticket. Si no lo ves, ábrelo con «Cobrar».',
      'Échale un ojo al ticket, que no falte nada.',
      'cart-checkout-btn',
    ),
    paso(
      'Elige cómo te paga.',
      'Pregúntale cómo paga y elige esa opción.',
      'cobro-metodo-Efectivo',
    ),
    paso(
      'Toca «Cobrar» para terminar. La venta queda guardada.',
      'Toca Cobrar y listo. ¡Venta hecha!',
      'cobro-submit',
    ),
  ],
};

export const COBRAR_ESCANER: Guia = {
  ...DE_CAJA,
  id: 'cobrar-escaner',
  tema: 'ventas',
  titulo: 'Cobrar con el escáner',
  pantallas: ['cobrar'],
  ir: { label: 'Cobrar', href: 'cobrar' },
  soloEn: 'telefono',
  pasos: [
    paso(
      'En Cobrar, toca el botón del escáner.',
      '¿Tiene código de barras? Toca el escáner.',
      'cobrar-scan',
    ),
    paso(
      'Apunta la cámara al código de barras.',
      'Apunta la cámara al código, sin prisa.',
      'escaner-sheet',
    ),
    paso(
      'Escanea uno tras otro. Cada código se agrega al ticket.',
      'Pasa los productos uno por uno. Yo los apunto.',
      'escaner-listo',
    ),
    paso(
      'Toca «Cobrar» y termina como siempre.',
      'Cuando acabes, toca Cobrar y cobra como siempre.',
      'cart-checkout-btn',
    ),
  ],
};

export const ALTA_PRODUCTO: Guia = {
  ...DE_CAJA,
  id: 'alta-producto',
  tema: 'productos',
  titulo: 'Dar de alta un producto',
  pantallas: ['cobrar'],
  ir: { label: 'Cobrar', href: 'cobrar' },
  pasos: [
    paso(
      'En Cobrar, busca el producto. Si no está, dalo de alta ahí mismo.',
      '¿No encuentras un producto? Lo damos de alta aquí mismo.',
      'cobrar-search',
    ),
    paso(
      'Escribe cómo se llama y en cuánto lo vendes.',
      'Dime cómo se llama y en cuánto lo vendes.',
      'producto-nuevo-nombre',
    ),
    paso(
      'Toca «Agregar y ponerlo en el ticket». Ya se puede vender.',
      'Agrégalo y ya va en el ticket. ¡Listo para vender!',
      'producto-nuevo-agregar',
    ),
  ],
};

export const CANCELAR_VENTA: Guia = {
  ...DE_CAJA,
  id: 'cancelar-venta',
  tema: 'ventas',
  titulo: 'Cancelar una venta',
  pantallas: ['ventas'],
  ir: { label: 'Ventas', href: 'ventas' },
  pasos: [
    paso(
      'En Ventas, toca la venta que quieres cancelar.',
      '¿Te equivocaste? Busca esa venta en Ventas.',
    ),
    paso('Toca «Cancelar venta».', 'Ábrela y toca Cancelar venta.', 'venta-detalle-cancelar'),
    paso('Escribe tu NIP y elige el motivo.', 'Pon tu NIP y dime por qué se cancela.'),
    paso(
      'Confirma. Si pagó en efectivo, devuélvele su dinero.',
      'Confirma. Si pagó en efectivo, regrésale su dinero.',
      'cancelar-confirmar',
    ),
  ],
};
