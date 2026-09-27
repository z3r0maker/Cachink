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
  'M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719';
const DOWNLOAD = 'M12 3v12M7 11l5 5 5-5M4 21h16';
const COPY =
  'M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2';

export interface Opcion {
  readonly label: string;
  readonly hint: string;
  readonly icon: string;
  /** The first option is the board's green, raised one; the others are white. */
  readonly principal: boolean;
  readonly tile: string;
  readonly disabled: boolean;
  readonly run: () => string | Promise<string>;
}

/** Empty (WhatsApp asks for the contact) or a whole ten-digit number. */
export const telValido = (tel: string): boolean => {
  const n = digits(tel).length;
  return n === 0 || n === 10;
};

/** The three ways out (OpComprobante); each returns the line the dialog confirms with. */
export function opciones(c: Comprobante, tel: string, cliente?: string): readonly Opcion[] {
  return [
    {
      label: 'Enviar por WhatsApp',
      hint: 'Se abre WhatsApp con el comprobante listo',
      icon: WA,
      principal: true,
      tile: colors.white,
      disabled: !telValido(tel),
      run: () => {
        window.open(whatsappUrl(tel, c, cliente), '_blank', 'noopener');
        recordarTelefono(tel, cliente);
        // D2 (ADR-083): WhatsApp opens with the text; the person still presses send.
        return digits(tel) === ''
          ? 'Se abrió WhatsApp. Escoge el contacto y dale enviar.'
          : `Se abrió WhatsApp con el comprobante para el ${tel.trim()}. Solo dale enviar.`;
      },
    },
    {
      label: 'Guardar imagen',
      hint: 'Una foto del comprobante en esta caja',
      icon: DOWNLOAD,
      principal: false,
      tile: colors.gray100,
      disabled: false,
      run: () => guardarImagen(c),
    },
    {
      label: 'Copiar texto',
      hint: 'Para pegarlo donde quieras',
      icon: COPY,
      principal: false,
      tile: colors.gray100,
      disabled: false,
      run: () => {
        void navigator.clipboard.writeText(receiptText(c, cliente));
        return 'Texto copiado. Pégalo donde quieras.';
      },
    },
  ];
}

export type ShareVariant = 'caja' | 'detalle';
