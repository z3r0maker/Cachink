/**
 * The option cards of each wizard step (N-12). Descriptions of the four
 * business types are the app's own (`packages/ui` es-mx `businessType`), so
 * the owner reads the same words on the phone and in the portal.
 */

import type { ChoiceDef } from './ui/choice-cards';
import { ICON } from './ui/icons';

export const TIPO_NEGOCIO: readonly ChoiceDef[] = [
  {
    value: 'producto-con-stock',
    title: 'Productos físicos con inventario',
    description: 'Vendes cosas que compras, produces o almacenas. Xangarro lleva tu stock.',
    icon: ICON.box,
  },
  {
    value: 'producto-sin-stock',
    title: 'Productos sin inventario',
    description: 'Vendes café, comida u otro producto que no necesita conteo de piezas.',
    icon: ICON.coffee,
  },
  {
    value: 'servicio',
    title: 'Servicios',
    description: 'Ofreces cortes, consultas, clases u otro servicio sin producto físico.',
    icon: ICON.scissors,
  },
  {
    value: 'mixto',
    title: 'Mezcla de productos y servicios',
    description: 'Vendes un poco de todo. Puedes configurar qué sigue stock y qué no.',
    icon: ICON.shapes,
  },
];

export const METODOS_COBRO: readonly ChoiceDef[] = [
  { value: 'Efectivo', title: 'Efectivo', description: 'Billetes y monedas.', icon: ICON.cash },
  {
    value: 'Tarjeta',
    title: 'Tarjeta',
    description: 'Débito o crédito, con terminal.',
    icon: ICON.card,
  },
  {
    value: 'Transferencia',
    title: 'Transferencia',
    description: 'SPEI desde la app del banco.',
    icon: ICON.transfer,
  },
  {
    value: 'Crédito',
    title: 'Crédito',
    description: 'Entregas hoy y te pagan después.',
    icon: ICON.handshake,
  },
];

/** A yes/no step: two cards with the step's own words. */
export function yesNo(si: string, siDesc: string, no: string, noDesc: string): ChoiceDef[] {
  return [
    { value: 'si', title: si, description: siDesc, icon: ICON.check },
    { value: 'no', title: no, description: noDesc, icon: ICON.x },
  ];
}

export const toYesNo = (v: boolean | undefined): string | null =>
  v === undefined ? null : v ? 'si' : 'no';

export const PERSONAS: readonly ChoiceDef[] = [
  { value: '1', title: 'Solo yo', description: 'Una persona, una caja.', icon: ICON.user },
  { value: '2', title: 'Dos personas', description: 'Tú y alguien más.', icon: ICON.users },
  { value: '3', title: 'De 3 a 5', description: 'Un equipo pequeño.', icon: ICON.users },
  { value: '6', title: 'Más de 5', description: 'Varios turnos o cajas.', icon: ICON.store },
];

/** 10 digits, optionally +52 — what `WizardAnswersSchema` accepts. */
export function normalizeWhatsapp(raw: string): string {
  return raw.replace(/[\s\-()]/g, '');
}

export const isWhatsapp = (v: string): boolean => /^(\+52)?\d{10}$/.test(v);
