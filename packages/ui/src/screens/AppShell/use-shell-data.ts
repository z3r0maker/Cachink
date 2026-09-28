/**
 * What the frame says about this caja, read from the session (El Mostrador
 * §11: never a literal like «Caja 1»):
 *
 * - `caja`: the name this device gave itself when it was linked
 *   (`ActivationConfig.deviceInfo.name`, what the owner sees in the portal).
 *   The server does not send back a name the owner gives it later; until it
 *   does, that is the best name the device has.
 * - `negocio`: the business row's name.
 * - `operador` and `turnoDesde`: who is signed in and when their open turno
 *   started, for the rail's and the sidebar's turno card.
 */
import { useQuery } from '@tanstack/react-query';
import { hhmmLocal } from '@xangarro/caja';
import type { UserId } from '@xangarro/domain';
import { useActivationContext } from '../../activation/activation-context';
import { useUsersRepository } from '../../app/repository-provider';
import { useUserId } from '../../app-config/use-app-config';
import { useCurrentBusiness } from '../../hooks/use-current-business';
import { useOpenCajaTurno } from '../../hooks/use-open-caja-turno';

export interface ShellOperador {
  readonly nombre: string;
  readonly iniciales: string;
}

export interface ShellData {
  readonly caja: string | null;
  readonly negocio: string | null;
  readonly operador: ShellOperador | null;
  /** "HH:MM" local, or null when no turno is open. */
  readonly turnoDesde: string | null;
}

/** «Ana Robledo» → «AR»; one name gives its first two letters. */
export function inicialesDe(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '';
  if (partes.length === 1) return (partes[0] ?? '').slice(0, 2).toUpperCase();
  return `${partes[0]?.[0] ?? ''}${partes[partes.length - 1]?.[0] ?? ''}`.toUpperCase();
}

function useOperador(): ShellOperador | null {
  const users = useUsersRepository();
  const userId = useUserId();
  const q = useQuery({
    queryKey: ['shell', 'operador', userId],
    queryFn: () => (userId ? users.findById(userId as UserId) : null),
    enabled: userId !== null,
  });
  const nombre = q.data?.nombre;
  return nombre ? { nombre, iniciales: inicialesDe(nombre) } : null;
}

export function useShellData(): ShellData {
  const { config } = useActivationContext();
  const negocio = useCurrentBusiness().data?.nombre ?? null;
  const operador = useOperador();
  const { openTurno } = useOpenCajaTurno();
  const caja = config.deviceInfo.name.trim();
  return {
    caja: caja.length > 0 ? caja : null,
    negocio,
    operador,
    turnoDesde: openTurno ? hhmmLocal(openTurno.aperturaAt) || null : null,
  };
}
