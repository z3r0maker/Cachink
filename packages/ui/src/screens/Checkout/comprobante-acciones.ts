/**
 * Where the comprobante goes from the phone (MvVentaHecha's share sheet):
 * WhatsApp and Mensajes open with the text ready (the person still presses
 * send, ADR-083 D2), and the phone's own share menu, which also copies. The
 * caja has no clipboard or printer module, so «Copiar» rides the share menu
 * and «Imprimir» is left out. Each returns the line the sheet confirms with.
 */
import { Linking, Platform, Share } from 'react-native';
import { abrirChatWhatsApp, type AperturaWhatsApp } from '../../app/abrir-whatsapp';

const AVISO_WHATSAPP: Readonly<Record<AperturaWhatsApp, string>> = {
  app: 'Se abrió WhatsApp. Escoge el contacto y dale enviar.',
  enlace: 'Abrimos el enlace de WhatsApp. Si no tienes la app, usa Mensajes o Copiar o compartir.',
  fallo: 'No se pudo abrir WhatsApp en este teléfono. Usa Mensajes o Copiar o compartir.',
};

export async function porWhatsApp(texto: string): Promise<string> {
  return AVISO_WHATSAPP[await abrirChatWhatsApp({ texto })];
}

/** `que` names what was sent: «el comprobante» or, from the close, «el corte». */
export async function porMensaje(texto: string, que = 'el comprobante'): Promise<string> {
  const sep = Platform.OS === 'ios' ? '&' : '?';
  try {
    await Linking.openURL(`sms:${sep}body=${encodeURIComponent(texto)}`);
    return `Se abrió Mensajes con ${que}. Escribe su número y dale enviar.`;
  } catch {
    return 'No se pudo abrir Mensajes en este teléfono.';
  }
}

export async function porMenu(texto: string): Promise<string> {
  try {
    const r = await Share.share({ message: texto });
    return r.action === Share.dismissedAction
      ? ''
      : 'Listo. Si escogiste Copiar, pégalo donde quieras.';
  } catch {
    return 'No se pudo abrir el menú de compartir.';
  }
}
