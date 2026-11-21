/**
 * The logo's cache on the phone (N-19): `expo-file-system/legacy`, the entry
 * `database-file.native.ts` already uses (SDK 55's main entry only warns or
 * throws on the path-based API). Type-erased at the boundary, as there.
 */
import type { LogoCache, LogoDescarga } from '@xangarro/application';
import { logoAlmacenDe, type LogoFs } from './logo-almacen.shared';

export async function cargarLogoAlmacen(): Promise<(LogoCache & LogoDescarga) | null> {
  const fs = (await import('expo-file-system/legacy')) as unknown as LogoFs;
  return logoAlmacenDe(fs);
}
