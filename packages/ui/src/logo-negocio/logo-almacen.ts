/**
 * Off the phone (web, tests) there is no logo cache: the comprobante keeps
 * its no-logo look. The phone's adapter is `logo-almacen.native.ts`.
 */
import type { LogoCache, LogoDescarga } from '@xangarro/application';

export async function cargarLogoAlmacen(): Promise<(LogoCache & LogoDescarga) | null> {
  return null;
}
