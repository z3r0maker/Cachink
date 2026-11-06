import 'server-only';

import { estadoDePrivacidad, type EstadoPrivacidad } from '@xangarro/domain';
import { consentsOfUser } from '@xangarro/data-pg';

import { AVISO_VERSION } from '@/legal/aviso-simplificado';

import { db } from '../db';
import { reportError } from '../observability/report';

/**
 * The signed-in account's privacy state (ADR-137): the aviso it accepted last,
 * its novedades choice, and whether the current aviso is new to it. Read from
 * the ledger through `privacy_consents_of_user` (0053), for the session's
 * account only.
 */
export async function estadoPrivacidadDe(userId: string): Promise<EstadoPrivacidad> {
  return estadoDePrivacidad(await consentsOfUser(db(), userId), AVISO_VERSION);
}

/**
 * The shell's «Aviso nuevo» chip and banner. A database blip shows neither,
 * rather than handing every route to the error page.
 */
export async function avisoNuevoPara(userId: string): Promise<boolean> {
  try {
    return (await estadoPrivacidadDe(userId)).avisoNuevo;
  } catch (error) {
    reportError(error, { endpoint: 'shell/aviso-nuevo' });
    return false;
  }
}
