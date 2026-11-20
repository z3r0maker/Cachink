/**
 * How «Mi acceso» words a passkey's dates (board CD-20c), in Mexico City time:
 * «Creada el 20 nov · último uso hoy a las 9:12».
 */
const ZONE = 'America/Mexico_City';

const day = new Intl.DateTimeFormat('es-MX', { timeZone: ZONE, day: 'numeric', month: 'short' });
const time = new Intl.DateTimeFormat('es-MX', {
  timeZone: ZONE,
  hour: 'numeric',
  minute: '2-digit',
  hourCycle: 'h23',
});
const key = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const shortDay = (d: Date) => day.format(d).replace('.', '');

/** 24-hour, without the leading zero the format pads with: «9:12», «20:00». */
export function hora(d: Date): string {
  return time.format(d).replace(/^0(\d)/, '$1');
}

export function passkeyDates(createdAt: Date, lastUsedAt: Date | null, now: Date): string {
  const created = `Creada el ${shortDay(createdAt)}`;
  if (lastUsedAt === null) return `${created} · todavía sin usar`;
  const when = key.format(lastUsedAt) === key.format(now) ? 'hoy' : `el ${shortDay(lastUsedAt)}`;
  return `${created} · último uso ${when} a las ${hora(lastUsedAt)}`;
}
