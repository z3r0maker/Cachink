/**
 * Opens a WhatsApp chat with the text ready; the person still presses send
 * (ADR-083 D2). It tries the app's own scheme, then the wa.me link, which also
 * reaches WhatsApp Business and otherwise lands on WhatsApp's web page.
 *
 * It never asks `Linking.canOpenURL` first. On iOS that call rejects for a
 * scheme missing from LSApplicationQueriesSchemes, and on Android 11+ it says
 * no without a <queries> entry. `openURL` needs neither: trying is the check.
 */
import { Linking } from 'react-native';

/** What opened: the app, the wa.me link (app or browser), or nothing. */
export type AperturaWhatsApp = 'app' | 'enlace' | 'fallo';

export interface ChatWhatsApp {
  readonly texto: string;
  /** Country code and digits («525512447903»). Without it, WhatsApp asks for the contact. */
  readonly numero?: string;
}

export function enlacesDeChat(chat: ChatWhatsApp): { app: string; web: string } {
  const t = encodeURIComponent(chat.texto);
  if (chat.numero === undefined) {
    return { app: `whatsapp://send?text=${t}`, web: `https://wa.me/?text=${t}` };
  }
  return {
    app: `whatsapp://send?phone=${chat.numero}&text=${t}`,
    web: `https://wa.me/${chat.numero}?text=${t}`,
  };
}

async function abre(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

export async function abrirChatWhatsApp(chat: ChatWhatsApp): Promise<AperturaWhatsApp> {
  const { app, web } = enlacesDeChat(chat);
  if (await abre(app)) return 'app';
  return (await abre(web)) ? 'enlace' : 'fallo';
}
