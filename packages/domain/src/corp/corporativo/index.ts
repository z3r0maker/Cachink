import { esDiaHabil } from '../agenda/dias-habiles.js';
import type { Socio } from '../ledger/movements.js';

/**
 * The corporate book (E-06): the share register and the certificates that
 * keep MEXIA able to sign and invoice. Share events come from E-21's cuts
 * once it ships; until then the founders record them by hand.
 */
export class EventoAccionesInvalidoError extends Error {
  readonly code = 'EVENTO_ACCIONES_INVALIDO' as const;
  constructor(message: string) {
    super(message);
    this.name = 'EventoAccionesInvalidoError';
  }
}

export class AccionesInsuficientesError extends Error {
  readonly code = 'ACCIONES_INSUFICIENTES' as const;
  constructor(
    readonly socio: Socio,
    readonly tiene: number,
  ) {
    super(
      `El Fundador ${socio} tiene ${tiene.toLocaleString('es-MX')} acciones: no puede transmitir más.`,
    );
    this.name = 'AccionesInsuficientesError';
  }
}

export class CertificadoInvalidoError extends Error {
  readonly code = 'CERTIFICADO_INVALIDO' as const;
  constructor(message: string) {
    super(message);
    this.name = 'CertificadoInvalidoError';
  }
}

export interface EventoAcciones {
  /** The date of the acta or the transfer, `YYYY-MM-DD`. */
  readonly fecha: string;
  /** New shares (constitution, a capital increase) or shares changing hands. */
  readonly tipo: 'suscripcion' | 'transmision';
  readonly de: Socio | null;
  readonly a: Socio;
  readonly acciones: number;
}

export type Tenencias = Readonly<Record<Socio, number>> & { readonly total: number };

export function tenencias(eventos: readonly EventoAcciones[]): Tenencias {
  const t = { 1: 0, 2: 0 };
  for (const e of eventos) {
    if (e.de !== null) t[e.de] -= e.acciones;
    t[e.a] += e.acciones;
  }
  return { ...t, total: t[1] + t[2] };
}

export function assertEventoAcciones(previos: readonly EventoAcciones[], e: EventoAcciones): void {
  esDiaHabil(e.fecha); // throws on a date that is not one
  if (!Number.isInteger(e.acciones) || e.acciones <= 0) {
    throw new EventoAccionesInvalidoError('Las acciones son un número entero mayor a cero.');
  }
  if (e.tipo === 'suscripcion') {
    if (e.de !== null)
      throw new EventoAccionesInvalidoError('Una suscripción no viene de un socio.');
    return;
  }
  if (e.de === null || e.de === e.a) {
    throw new EventoAccionesInvalidoError('Una transmisión va de un socio al otro.');
  }
  const tiene = tenencias(previos)[e.de];
  if (e.acciones > tiene) throw new AccionesInsuficientesError(e.de, tiene);
}

export type TipoCertificado = 'csd' | 'efirma';
export type Titular = 'mexia' | 'f1' | 'f2';

/** Metadata only: never a key file, a .cer or a password (ADR-124). */
export interface Certificado {
  readonly id: string;
  readonly tipo: TipoCertificado;
  readonly titular: Titular;
  /** The certificate's serial number, as the SAT shows it (public data). */
  readonly serie: string;
  readonly vence: string;
}

const SERIE = /^[0-9A-Za-z]{4,40}$/;

export function assertCertificado(c: Omit<Certificado, 'id'>): void {
  if (!SERIE.test(c.serie)) {
    throw new CertificadoInvalidoError(
      'Escribe solo el número de serie: letras y números, sin archivos.',
    );
  }
  try {
    esDiaHabil(c.vence);
  } catch {
    throw new CertificadoInvalidoError('Elige la fecha de vencimiento.');
  }
  if (c.tipo === 'csd' && c.titular !== 'mexia') {
    throw new CertificadoInvalidoError('El CSD es de MEXIA, no de un socio.');
  }
}

/** The newest certificate of each kind and holder; a renewal supersedes the old one. */
export function certificadosVigentes(certs: readonly Certificado[]): readonly Certificado[] {
  const por = new Map<string, Certificado>();
  for (const c of certs) {
    const k = `${c.tipo}:${c.titular}`;
    const prev = por.get(k);
    if (prev === undefined || c.vence > prev.vence) por.set(k, c);
  }
  return [...por.values()];
}

const DAY_MS = 86_400_000;
const dias = (hoy: string, vence: string) =>
  Math.round((Date.parse(`${vence}T12:00:00Z`) - Date.parse(`${hoy}T12:00:00Z`)) / DAY_MS);

/** E-06's signal for the Resumen (E-16): a current certificate expiring within `ventana` days. */
export function alertasDeCertificados(
  certs: readonly Certificado[],
  hoy: string,
  ventana = 60,
): readonly { readonly certificado: Certificado; readonly dias: number }[] {
  return certificadosVigentes(certs)
    .map((c) => ({ certificado: c, dias: dias(hoy, c.vence) }))
    .filter((a) => a.dias <= ventana)
    .sort((a, b) => a.dias - b.dias);
}
