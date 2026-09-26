import type { DonPose } from '@/components';

/**
 * What Don Cuentas says beside each «Platícanos de ti» question (ADR-107),
 * one per step in `STEPS` order, and the pose he says it in.
 */
export interface DonLine {
  readonly pose: DonPose;
  readonly text: string;
}

export const INTRO: DonLine = {
  pose: 'hola',
  text: '¡Qué tal! Soy Don Cuentas. Llevo las cuentas de tu changarro para que tú te dediques a vender.',
};

export const DON_LINES: readonly DonLine[] = [
  { pose: 'hola', text: 'Empecemos por lo fácil: ¿cómo le dicen a tu changarro?' },
  { pose: 'pensando', text: 'Marca todas. Si luego cambias de opinión, se ajusta en Mi negocio.' },
  { pose: 'contando', text: 'Si cuentas piezas, te aviso antes de que se te acaben.' },
  { pose: 'quieto', text: 'Así te ayudo a cuadrar la caja cuando cierras el turno.' },
  { pose: 'senalando', text: 'Los fiados también cuentan. Yo te recuerdo quién te debe.' },
  { pose: 'hola', text: 'Tu WhatsApp y tu logo salen en tus comprobantes. Se ve bien pro.' },
  { pose: 'pensando', text: 'Solo si quieres factura de tu plan. Si no, ni te preocupes.' },
  {
    pose: 'quieto',
    text: 'Cada persona que cobra tiene su propia caja y su NIP. Nada de compartir contraseñas.',
  },
];

/** The line for a step; the intro's if the index is out of range. */
export function donLine(index: number): DonLine {
  return DON_LINES[index] ?? INTRO;
}
