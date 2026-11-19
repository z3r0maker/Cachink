/**
 * «Recordarle su saldo»: a WhatsApp reminder to the client's phone. The link
 * is composed from the number as typed («5512 447 903») and the live message
 * (`recordatorio` in `@xangarro/caja/cobranza`); nothing is sent by the caja —
 * the operator presses send (ADR-083 D2), like the comprobante (N-21).
 */
import { abrirChatWhatsApp, enlacesDeChat, type AperturaWhatsApp } from '../../app/abrir-whatsapp';

const AVISO_WHATSAPP: Readonly<Record<AperturaWhatsApp, string>> = {
  app: 'Se abrió WhatsApp con el recordatorio. Tú decides si lo mandas.',
  enlace: 'Abrimos el enlace de WhatsApp. Si no tienes la app, instálala para mandarlo.',
  fallo: 'No se pudo abrir WhatsApp en este teléfono.',
};

/** «5512 447 903» → «5512447903». */
export const digitos = (tel: string): string => tel.replace(/\D/g, '');

/** A Mexican mobile: 10 digits. */
export const telefonoCompleto = (tel: string): boolean => digitos(tel).length === 10;

/** The wa.me deep link (Track N row 13): +52, the digits, and the text ready. */
export function enlaceWhatsApp(telefono: string, mensaje: string): string {
  return enlacesDeChat({ texto: mensaje, numero: `52${digitos(telefono)}` }).web;
}

/**
 * Opens WhatsApp on the reminder. Returns the line the sheet confirms with;
 * the caller still decides whether to send.
 */
export async function abrirWhatsApp(telefono: string, mensaje: string): Promise<string> {
  const chat = telefonoCompleto(telefono)
    ? { texto: mensaje, numero: `52${digitos(telefono)}` }
    : { texto: mensaje };
  return AVISO_WHATSAPP[await abrirChatWhatsApp(chat)];
}
