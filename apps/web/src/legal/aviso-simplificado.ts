/**
 * The aviso de privacidad simplificado shown at signup (art. 16 II LFPDPPP),
 * as data: the form renders it, the server hashes it, the ledger records the
 * hash. Source text: `docs/legal/aviso/aviso-simplificado.md`, variante A.
 *
 * **Every version ever published stays here, unedited** (ADR-137): the ledger
 * proves which text someone accepted by its hash, and a hash of a text nobody
 * kept proves nothing. A change is a new entry in `PUBLICADOS` and a new
 * `AVISO_VERSION`; `tests/legal-aviso.test.ts` pins each version's hash, so an
 * old one cannot be edited quietly. «Privacidad y mis datos» shows the exact
 * text a person accepted from here.
 *
 * **Bracketed values are production gaps** — see
 * `docs/launch/production-readiness.md`.
 */

import { TERMINOS_PUBLICO_URL } from '@xangarro/domain';

export const AVISO_INTEGRAL_URL = 'https://xangarro.mx/privacidad' as const;
/** One URL for the Términos everywhere (Checkout, emails, signup). */
export const TERMINOS_URL = TERMINOS_PUBLICO_URL;

interface Publicado {
  /** The day it was published, `YYYY-MM-DD`. */
  readonly publicado: string;
  /** What changed from the version before, as the «Aviso nuevo» card says it; `null` for the first kept. */
  readonly cambios: string | null;
  readonly parrafos: Readonly<Record<string, string>>;
}

const PUBLICADOS = {
  '0.2-borrador': {
    publicado: '2026-10-28',
    cambios: null,
    parrafos: {
      responsable:
        'MEXIA, S.A.S. (Xangarro), con domicilio en Paseo Lomas Altas 524, interior 9, colonia Loma Real, C.P. 45129, Zapopan, Jalisco, es responsable de tus datos.',
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
    },
  },
  '0.3-borrador': {
    publicado: '2026-11-06',
    cambios:
      'Cómo limitar el uso ahora te lleva a Privacidad y mis datos, en el menú de tu cuenta. Las finalidades son las mismas.',
    parrafos: {
      responsable:
        'MEXIA, S.A.S. (Xangarro), con domicilio en Paseo Lomas Altas 524, interior 9, colonia Loma Real, C.P. 45129, Zapopan, Jalisco, es responsable de tus datos.',
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
        'Cómo limitar el uso: desactiva las novedades aquí o en Privacidad y mis datos, en el menú de tu ' +
        'cuenta, o escribe a ' +
        '[CORREO PRIVACIDAD].',
    },
  },
} as const satisfies Record<string, Publicado>;

export type AvisoVersion = keyof typeof PUBLICADOS;

export const AVISO_VERSION = '0.3-borrador' as const satisfies AvisoVersion;

export const AVISO_SIMPLIFICADO = PUBLICADOS[AVISO_VERSION].parrafos;

export const AVISO_PARRAFOS: readonly string[] = Object.values(AVISO_SIMPLIFICADO);

/**
 * The exact bytes the ledger's `aviso_sha256` covers: version, each paragraph,
 * the two URLs. Deterministic; no whitespace the renderer might vary.
 */
export function avisoTextoCanonico(): string {
  return avisoTextoDe(AVISO_VERSION) ?? '';
}

const esPublicado = (v: string): v is AvisoVersion => Object.hasOwn(PUBLICADOS, v);

/** The canonical text of any version ever published; `undefined` for one never published. */
export function avisoTextoDe(version: string): string | undefined {
  if (!esPublicado(version)) return undefined;
  const parrafos = Object.values(PUBLICADOS[version].parrafos);
  return [version, ...parrafos, AVISO_INTEGRAL_URL, TERMINOS_URL].join('\n');
}

/** What the privacy page shows for a version: its paragraphs, its day and what changed. */
export function avisoPublicado(version: string):
  | {
      readonly parrafos: readonly string[];
      readonly publicado: string;
      readonly cambios: string | null;
    }
  | undefined {
  if (!esPublicado(version)) return undefined;
  const p = PUBLICADOS[version];
  return { parrafos: Object.values(p.parrafos), publicado: p.publicado, cambios: p.cambios };
}
