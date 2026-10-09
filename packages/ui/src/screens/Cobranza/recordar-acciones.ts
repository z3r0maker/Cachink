/**
 * Where «Recordarle su saldo» goes from the phone (MvRecordarSaldo): WhatsApp
 * and Mensajes open on the client's number with the message ready (the
 * person still presses send, ADR-083 D2), and the phone's share menu, which
 * also copies (the caja has no clipboard module, as M-07's comprobante).
 * Each returns the line the sheet confirms with.
 */
import { Linking, Platform } from 'react-native';
import { porMenu } from '../Checkout/comprobante-acciones';
import { digitosTel } from './cobranza-logic';

export async function recordarPorWhatsApp(tel: string, texto: string): Promise<string> {
  const numero = `52${digitosTel(tel)}`;
  const t = encodeURIComponent(texto);
  const app = `whatsapp://send?phone=${numero}&text=${t}`;
  try {
    const hay = await Linking.canOpenURL(app);
    await Linking.openURL(hay ? app : `https://wa.me/${numero}?text=${t}`);
    return 'Se abrió WhatsApp con el mensaje listo. Dale enviar.';
  } catch {
    return 'No se pudo abrir WhatsApp en este teléfono.';
  }
}

export async function recordarPorMensaje(tel: string, texto: string): Promise<string> {
  const sep = Platform.OS === 'ios' ? '&' : '?';
  try {
    await Linking.openURL(`sms:+52${digitosTel(tel)}${sep}body=${encodeURIComponent(texto)}`);
    return 'Se abrió Mensajes con el mensaje listo. Dale enviar.';
  } catch {
    return 'No se pudo abrir Mensajes en este teléfono.';
  }
}

export const recordarPorMenu = (texto: string): Promise<string> => porMenu(texto);
