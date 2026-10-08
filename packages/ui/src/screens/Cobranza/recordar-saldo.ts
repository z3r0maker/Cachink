/**
 * «Recordarle su saldo»: a WhatsApp reminder to the client's phone. The link
 * is composed from the number as typed («5512 447 903») and the live message
 * (`recordatorio` in `@xangarro/caja/cobranza`); nothing is sent by the caja —
 * the operator presses send (ADR-083 D2), like the comprobante (N-21).
 */
import { Linking } from 'react-native';

/** «5512 447 903» → «5512447903». */
export const digitos = (tel: string): string => tel.replace(/\D/g, '');

/** A Mexican mobile: 10 digits. */
export const telefonoCompleto = (tel: string): boolean => digitos(tel).length === 10;

/** The wa.me deep link (Track N row 13): +52, the digits, and the text ready. */
export function enlaceWhatsApp(telefono: string, mensaje: string): string {
  return `https://wa.me/52${digitos(telefono)}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Opens WhatsApp on the reminder. Returns the line the sheet confirms with;
 * the caller still decides whether to send.
 */
export async function abrirWhatsApp(telefono: string, mensaje: string): Promise<string> {
  const texto = encodeURIComponent(mensaje);
  const alNumero = telefonoCompleto(telefono) ? enlaceWhatsApp(telefono, mensaje) : null;
  const url = alNumero ?? `https://wa.me/?text=${texto}`;
  try {
    await Linking.openURL((await Linking.canOpenURL(url)) ? url : `https://wa.me/?text=${texto}`);
    return 'Se abrió WhatsApp con el recordatorio. Tú decides si lo mandas.';
  } catch {
    return 'No se pudo abrir WhatsApp en este teléfono.';
  }
}
