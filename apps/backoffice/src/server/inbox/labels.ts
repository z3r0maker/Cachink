import type { SupportKind, SupportStatus } from '@xangarro/domain';

/** Spanish copy for the inbox's enums — one place, shared by list, detail and digest. */
export const KIND_LABELS: Record<SupportKind, string> = {
  arco: 'ARCO',
  ayuda: 'Ayuda',
  bug: 'Error',
  factura: 'Factura',
  migracion: 'Migración',
  escalacion: 'Escalación',
  limite: 'Límite',
  explorador: 'Explorador',
  sistema: 'Sistema',
};

export const STATUS_LABELS: Record<SupportStatus, string> = {
  nuevo: 'Nuevo',
  en_curso: 'En curso',
  resuelto: 'Resuelto',
};

const dateTime = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Mexico_City',
});

const day = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeZone: 'America/Mexico_City',
});

/** An ARCO deadline as the CDMX day it falls on, e.g. «21 oct 2026». */
export function formatDueDay(iso: string): string {
  return day.format(new Date(iso));
}

/** An ISO instant as CDMX wall-clock time, e.g. «17 sept 2026, 6:00 a.m.». */
export function formatInstant(iso: string): string {
  return dateTime.format(new Date(iso));
}
