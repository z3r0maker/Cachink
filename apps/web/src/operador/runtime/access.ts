/**
 * The linking and turno operations behind Operador · Acceso (O-12, ADR-071
 * §1, ADR-072 §2–3): apply the activation bootstrap, list the operators, verify
 * a NIP locally (bcryptjs is pure JS — the coworker-at-the-counter threat
 * model is offline by design), and open the caja against the fondo counted.
 * All of it runs in the Worker, over the same repositories as the phone.
 */

import { AbrirCajaUseCase, AutenticarUsuarioUseCase } from '@xangarro/application';
import { DrizzleCajaTurnosRepository, DrizzleUsersRepository } from '@xangarro/data';
import type { BusinessId } from '@xangarro/domain';
import { applyReferenceTables } from '@xangarro/sync';
import type { ReferenceTables } from '@xangarro/contracts';

import { hoyLocal } from './fechas';
import type { Db } from './db-types';

export interface OperadorPara {
  readonly id: string;
  readonly nombre: string;
  readonly avatarColor: string;
}

export interface SesionAbierta {
  readonly userId: string;
  readonly turnoId: string;
}

/** The activation's reference tables become the register's local database. */
export async function vincularBootstrap(
  db: Db,
  tables: ReferenceTables,
  businessId: BusinessId,
): Promise<void> {
  await applyReferenceTables(db as never, tables, businessId);
}

/** The operator picker: «¿Quién abre turno?» */
export async function operadores(
  db: Db,
  businessId: BusinessId,
  deviceId: string,
): Promise<readonly OperadorPara[]> {
  const users = await new DrizzleUsersRepository(db as never, deviceId as never).findAllByBusiness(
    businessId,
  );
  return users
    .filter((u) => u.active && u.deletedAt === null)
    .map((u) => ({ id: u.id, nombre: u.nombre, avatarColor: u.avatarColor }));
}

/** Four digits against the operator's hash — on the device (ADR-072 §3). */
export async function autenticar(
  db: Db,
  businessId: BusinessId,
  deviceId: string,
  nombre: string,
  nip: string,
): Promise<{ success: boolean; userId: string | null }> {
  const result = await new AutenticarUsuarioUseCase(
    new DrizzleUsersRepository(db as never, deviceId as never),
  ).execute({ nombre, pin: nip, businessId });
  return { success: result.success, userId: result.success ? result.userId : null };
}

/** The fondo counted opens the turno — the gate O-12 contributes. */
export async function abrirCaja(
  db: Db,
  businessId: BusinessId,
  deviceId: string,
  userId: string,
  fondoCentavos: bigint,
): Promise<{ turnoId: string }> {
  const useCase = new AbrirCajaUseCase(
    new DrizzleCajaTurnosRepository(db as never, deviceId as never, userId as never),
  );
  const turno = await useCase.execute({
    userId: userId as never,
    fecha: hoyLocal() as never,
    montoAperturaCentavos: fondoCentavos,
    efectivoAdicionalCentavos: 0n,
    businessId,
  });
  return { turnoId: turno.id };
}

/** One open turno per caja (ADR-071 §3) — whose is it? */
export async function turnoAbierto(
  db: Db,
  businessId: BusinessId,
  deviceId: string,
): Promise<SesionAbierta | null> {
  const open = await new DrizzleCajaTurnosRepository(
    db as never,
    deviceId as never,
  ).findOpenByBusiness(businessId);
  return open === null ? null : { userId: open.userId, turnoId: open.id };
}
