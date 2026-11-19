/**
 * What the camera's permission button can do. After a refusal iOS never shows
 * its prompt again and a request returns at once, so the only way forward is
 * the app's page in Settings.
 */
export type AccionPermisoCamara = 'pedir' | 'ajustes';

export function accionPermisoCamara(
  permiso: { readonly canAskAgain: boolean } | null,
): AccionPermisoCamara {
  return permiso === null || permiso.canAskAgain ? 'pedir' : 'ajustes';
}
