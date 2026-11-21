/**
 * Expo Router's hook for links the OS opens the app with: a pairing link
 * goes home, where the activation gate takes its token (N-25,
 * `shell/ruta-de-enlace.ts`).
 */
import { rutaDeEnlace } from '../shell/ruta-de-enlace';

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  return rutaDeEnlace(path);
}
