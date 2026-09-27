import { deviceHeaders } from '@xangarro/contracts';
import { AVISO_VINCULACION_VERSION } from '@xangarro/domain';

/** POST /api/v1/activate as a browser device (ADR-071 §1), and its answers. */

export interface Vinculo {
  readonly deviceToken: string;
  readonly deviceId: string;
  readonly businessId: string;
  readonly tables: object;
}

/** Uppercased; spaces, dots and hyphens ignored, as the design says. */
export function limpiarCodigo(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[\s·.-]/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
}

const MENSAJE = 'No se pudo conectar. Inténtalo de nuevo.';

/** The contract's refusal codes, as the person at the counter reads them. */
function rechazo(code: string | undefined): string | null {
  switch (code) {
    // One answer for a wrong code and a wrong email (SEC-DEV-01): the server no
    // longer says which, so the counter checks both. EMAIL_MISMATCH is an older
    // server's word for the same thing.
    case 'CODE_INVALID':
    case 'EMAIL_MISMATCH':
      return 'El correo o el código no coinciden. Revisa los dos o pídele al dueño uno nuevo.';
    case 'CODE_EXPIRED':
      return 'El código expiró. Pídele al dueño otro desde el portal.';
    case 'CODE_USED':
      return 'Ese código ya se usó. Pídele al dueño otro desde el portal.';
    case 'RATE_LIMITED':
      return 'Demasiados intentos. Espera unos minutos.';
    default:
      return null;
  }
}

export type Activacion =
  | { readonly ok: true; readonly vinculo: Vinculo }
  | { readonly ok: false; readonly mensaje: string; readonly delCodigo: boolean };

/** The request the phone sends, with this browser's device identity. */
function peticion(email: string, codigo: string): Request {
  return new Request('/api/v1/activate', {
    method: 'POST',
    headers: deviceHeaders(),
    body: JSON.stringify({
      email,
      code: codigo,
      device: {
        name: 'Caja · web',
        platform: 'web',
        appVersion: '0.1.0',
        osVersion: navigator.platform || 'web',
      },
      avisoVersion: AVISO_VINCULACION_VERSION,
    }),
  });
}

/** POST /api/v1/activate as a browser device (ADR-071 §1). */
export async function activar(email: string, codigo: string): Promise<Activacion> {
  try {
    const res = await fetch(peticion(email, codigo));
    const body: unknown = await res.json();
    if (!res.ok) {
      const env = body as { error?: { code?: string; message?: string } };
      const dicho = rechazo(env.error?.code);
      return {
        ok: false,
        mensaje: dicho ?? env.error?.message ?? MENSAJE,
        delCodigo: dicho !== null && env.error?.code !== 'RATE_LIMITED',
      };
    }
    return { ok: true, vinculo: vinculoDe(body) };
  } catch {
    return {
      ok: false,
      mensaje: 'Sin conexión con el portal. Revisa la red e inténtalo de nuevo.',
      delCodigo: false,
    };
  }
}

function vinculoDe(body: unknown): Vinculo {
  const data = body as {
    deviceToken: string;
    deviceId: string;
    bootstrap: { tables: { businesses: { id: string }[] } };
  };
  return {
    deviceToken: data.deviceToken,
    deviceId: data.deviceId,
    businessId: data.bootstrap.tables.businesses[0]?.id ?? '',
    tables: data.bootstrap.tables as object,
  };
}
