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
 * add it to `PUBLICADOS` and keep the old ones, so a device still running an
 * older build keeps getting its text hashed.
 */

/** The public aviso; ADR-069: the phone links to the website, not the portal. */
export const AVISO_PUBLICO_URL = 'https://xangarro.mx/privacidad/' as const;

/** The public terms, next to the aviso in the phone's Ajustes. */
export const TERMINOS_PUBLICO_URL = 'https://xangarro.mx/terminos/' as const;

/** The button under the aviso that opens it in full (5.1.1(i): a tappable link). */
export const AVISO_VINCULACION_ENLACE = 'Leer el aviso completo' as const;

const RESPONSABLE =
  'Tu privacidad. MEXIA, S.A.S. (Xangarro), Paseo Lomas Altas 524, interior 9, colonia Loma Real, C.P. 45129, Zapopan, Jalisco, trata los datos técnicos de este ' +
  'dispositivo (identificador, modelo, sistema y versión) y los registros que captures, para ' +
  'sincronizarlos con tu negocio y mantener el servicio seguro.';

const ENCARGADO =
  'Los datos de clientes y operadores los trata Xangarro por cuenta del negocio, que es su ' +
  'responsable. No usamos datos sensibles. Los reportes de fallas son opcionales y puedes ' +
  'desactivarlos en Ajustes.';

/**
 * Every version ever shown, with the lines its hash covers. 0.2 wrote the
 * address as text; 0.3 moved it to a button, so the button and its address
 * are part of what was shown.
 */
const PUBLICADOS = {
  '0.2-borrador': [
    RESPONSABLE,
    ENCARGADO,
    'Aviso completo y derechos ARCO: xangarro.mx/privacidad',
  ],
  '0.3-borrador': [
    RESPONSABLE,
    ENCARGADO,
    'El aviso completo explica tus derechos ARCO.',
    `${AVISO_VINCULACION_ENLACE}: ${AVISO_PUBLICO_URL}`,
  ],
} as const satisfies Record<string, readonly string[]>;

export const AVISO_VINCULACION_VERSION = '0.3-borrador' as const satisfies keyof typeof PUBLICADOS;

/** The paragraphs the current version shows; the button follows them. */
export const AVISO_VINCULACION = PUBLICADOS[AVISO_VINCULACION_VERSION].slice(0, 3);

/** The exact text the device-row hash covers: the version, then each line. */
export function avisoVinculacionTexto(): string {
  return [AVISO_VINCULACION_VERSION, ...PUBLICADOS[AVISO_VINCULACION_VERSION]].join('\n');
}

/**
 * The same text for any version this code ever published, so a device on an
 * older build still gets its hash; `undefined` for one it never published.
 */
export function avisoVinculacionTextoDe(version: string): string | undefined {
  if (!Object.hasOwn(PUBLICADOS, version)) return undefined;
  return [version, ...PUBLICADOS[version as keyof typeof PUBLICADOS]].join('\n');
}
