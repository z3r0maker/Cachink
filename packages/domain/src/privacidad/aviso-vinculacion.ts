/**
 * The aviso shown when a device is linked to a business (N-34, variante B of
 * `docs/legal/aviso/aviso-simplificado.md`): on the phone's activation screen
 * and on the browser register's «Vincula esta caja».
 *
 * It asks for nothing. Whoever links a device either accepted the aviso when
 * they created the account, or is an operator whose data the business
 * handles, with Xangarro as encargado. What the law needs is that the notice
 * was put in front of them, so the device sends the version it showed and the
 * server keeps it, with the hash of this text, on the device row.
 *
 * **Bracketed values are production gaps** (O-17). Any edit is a new version:
 * bump `AVISO_VINCULACION_VERSION`.
 */

export const AVISO_VINCULACION_VERSION = '0.1-borrador' as const;

/** The public aviso; ADR-069: the phone links to the website, not the portal. */
export const AVISO_PUBLICO_URL = 'https://xangarro.mx/privacidad' as const;

export const AVISO_VINCULACION = [
  'Tu privacidad. [RAZÓN SOCIAL] (Xangarro), [DOMICILIO], trata los datos técnicos de este ' +
    'dispositivo (identificador, modelo, sistema y versión) y los registros que captures, para ' +
    'sincronizarlos con tu negocio y mantener el servicio seguro.',
  'Los datos de clientes y operadores los trata Xangarro por cuenta del negocio, que es su ' +
    'responsable. No usamos datos sensibles. Los reportes de fallas son opcionales y puedes ' +
    'desactivarlos en Ajustes.',
  'Aviso completo y derechos ARCO: xangarro.mx/privacidad',
] as const;

/** The exact text the device-row hash covers: version, then each paragraph. */
export function avisoVinculacionTexto(): string {
  return [AVISO_VINCULACION_VERSION, ...AVISO_VINCULACION].join('\n');
}
