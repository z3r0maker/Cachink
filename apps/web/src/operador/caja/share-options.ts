import { colors } from '@xangarro/tokens';

import {
  digits,
  guardarImagen,
  receiptText,
  recordarTelefono,
  whatsappUrl,
  type Comprobante,
} from './receipt';

const WA =
  'M20.5 3.5A10 10 0 0 0 3.2 15.6L2 22l6.5-1.2A10 10 0 1 0 20.5 3.5M8.5 8.5c.3 1.5 1 2.8 2 3.8s2.3 1.7 3.8 2c.6-.6 1-1.3 1.4-1.2l2 .8c.2 1.3-.6 2.2-1.8 2.3-3 .2-7.7-4.4-7.9-7.5-.1-1.2.8-2 2.1-1.8l.8 2c.1.4-.6.9-1.2 1.4';
const DOWNLOAD = 'M12 3v12M7 11l5 5 5-5M4 21h16';
const COPY = 'M9 9h10v10H9V9Zm-4 6H3V3h12v2';

export interface Opcion {
  readonly label: string;
  readonly hint: string;
  readonly icon: string;
  readonly bg: string;
  readonly disabled: boolean;
  readonly run: () => string | Promise<string>;
}

/** The three ways out; each returns the confirmation the design shows. */
export function opciones(c: Comprobante, tel: string, cliente?: string): readonly Opcion[] {
  return [
    {
      label: 'Enviar por WhatsApp',
      hint: 'Se abre WhatsApp con el comprobante listo',
      icon: WA,
      bg: colors.greenSoft,
      disabled: digits(tel).length < 10,
      run: () => {
        window.open(whatsappUrl(tel, c), '_blank', 'noopener');
        recordarTelefono(tel, cliente);
        // D2 (ADR-083): WhatsApp opens with the text; the person still presses send.
        return `WhatsApp abierto con el comprobante para el ${tel}.`;
      },
    },
    {
      label: 'Guardar imagen',
      hint: 'PNG del comprobante en este dispositivo',
      icon: DOWNLOAD,
      bg: colors.white,
      disabled: false,
      run: () => guardarImagen(c),
    },
    {
      label: 'Copiar texto',
      hint: 'Para pegarlo donde quieras',
      icon: COPY,
      bg: colors.white,
      disabled: false,
      run: () => {
        void navigator.clipboard.writeText(receiptText(c));
        return 'Texto del comprobante copiado.';
      },
    },
  ];
}

export type ShareVariant = 'caja' | 'detalle';

/**
 * The two files differ in size only: Caja's modal previews the receipt at 440 px;
 * Detalle de venta's is titled with the folio, 420 px, with 60 px options.
 */
export const VARIANTS = {
  caja: {
    title: () => 'Compartir comprobante',
    width: 440,
    gap: 16,
    preview: true,
    option: 62,
    tile: 40,
    icon: 20,
    labelSpacing: '-0.015em',
  },
  detalle: {
    title: (folio: string) => `Compartir ${folio}`,
    width: 420,
    gap: 14,
    preview: false,
    option: 60,
    tile: 38,
    icon: 19,
    labelSpacing: 'normal',
  },
} as const;
export type Variant = (typeof VARIANTS)[ShareVariant];
