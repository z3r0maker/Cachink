/**
 * Opens a public xangarro.mx page in the browser: Ajustes' aviso and
 * términos, and the aviso's button at linking. A failure leaves the screen
 * as it was; there is nothing for the operator to retry.
 */
import { Linking } from 'react-native';

export function abrirEnNavegador(url: string): void {
  Linking.openURL(url).catch(() => undefined);
}
