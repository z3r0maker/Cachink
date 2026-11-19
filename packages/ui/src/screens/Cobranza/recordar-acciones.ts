/**
 * Where «Recordarle su saldo» goes from the phone (MvRecordarSaldo): WhatsApp
 * and Mensajes open on the client's number with the message ready (the
 * person still presses send, ADR-083 D2), and the phone's share menu, which
 * also copies (the caja has no clipboard module, as M-07's comprobante).
 * Each returns the line the sheet confirms with.
 */
import { Linking, Platform } from 'react-native';
import { abrirChatWhatsApp, type AperturaWhatsApp } from '../../app/abrir-whatsapp';
import { porMenu } from '../Checkout/comprobante-acciones';
import { digitosTel } from './cobranza-logic';

const AVISO_WHATSAPP: Readonly<Record<AperturaWhatsApp, string>> = {
  app: 'Se abrió WhatsApp con el mensaje listo. Dale enviar.',
  enlace: 'Abrimos el enlace de WhatsApp. Si no tienes la app, usa Mensajes o Compartir.',
  fallo: 'No se pudo abrir WhatsApp en este teléfono. Usa Mensajes o Compartir.',
};

export async function recordarPorWhatsApp(tel: string, texto: string): Promise<string> {
  return AVISO_WHATSAPP[await abrirChatWhatsApp({ texto, numero: `52${digitosTel(tel)}` })];
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
