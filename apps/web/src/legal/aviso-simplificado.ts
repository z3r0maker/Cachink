/**
 * The aviso de privacidad simplificado shown at signup (art. 16 II LFPDPPP),
 * as data: the form renders it, the server hashes it, the ledger records the
 * hash. Source text: `docs/legal/aviso/aviso-simplificado.md`, variante A.
 *
 * **Bracketed values are production gaps** — see
 * `docs/launch/production-readiness.md`. Any edit here is a new version: bump
 * `AVISO_VERSION`, because the hash changes and the ledger must say why.
 */

export const AVISO_VERSION = '0.1-borrador' as const;

export const AVISO_INTEGRAL_URL = 'https://xangarro.mx/privacidad' as const;
export const TERMINOS_URL = 'https://xangarro.mx/terminos' as const;

export const AVISO_SIMPLIFICADO = {
  responsable:
    '[RAZÓN SOCIAL] (Xangarro), con domicilio en [DOMICILIO], es responsable de tus datos.',
  datos:
    'Qué datos usamos: tu nombre, correo, teléfono y contraseña; los datos fiscales y del negocio ' +
    '(RFC, régimen, código postal); tus pagos y los registros de tu negocio, que pueden ser datos ' +
    'patrimoniales o financieros; y datos técnicos de tus dispositivos. No te pedimos datos sensibles.',
  finalidades:
    'Para qué: crear y proteger tu cuenta, prestarte el servicio y sincronizar tus registros, cobrar ' +
    'tu suscripción y emitir tu CFDI, darte soporte, avisarte del servicio y cumplir la ley. Además, ' +
    'si lo aceptas: enviarte novedades y consejos.',
  proveedores:
    'Para prestarte el servicio usamos proveedores, algunos en Estados Unidos. No vendemos tus datos.',
  limitar:
    'Cómo limitar el uso: desactiva las novedades aquí o en Configuración → Privacidad, o escribe a ' +
    '[CORREO PRIVACIDAD].',
} as const;

export const AVISO_PARRAFOS = Object.values(AVISO_SIMPLIFICADO);

/**
 * The exact bytes the ledger's `aviso_sha256` covers: version, each paragraph,
 * the two URLs. Deterministic; no whitespace the renderer might vary.
 */
export function avisoTextoCanonico(): string {
  return [AVISO_VERSION, ...AVISO_PARRAFOS, AVISO_INTEGRAL_URL, TERMINOS_URL].join('\n');
}
