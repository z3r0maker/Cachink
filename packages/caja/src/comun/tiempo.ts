/**
 * Times said to the person at the counter (DS-05, DS-07): «7:42 p. m.»,
 * «en 2 min», «hace 3 min». Pure: the caller passes the clock.
 */

const MINUTO = 60_000;

/** «7:42 p. m.»: the device's local time of day, the es-MX way. */
export function horaDelDia(ms: number): string {
  const d = new Date(ms);
  const h = d.getHours();
  const doce = h % 12 === 0 ? 12 : h % 12;
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${doce}:${mm} ${h < 12 ? 'a. m.' : 'p. m.'}`;
}

/** «en 2 min»: whole minutes, rounded up, never below one. */
export function enMinutos(ms: number): string {
  return `en ${Math.max(1, Math.ceil(ms / MINUTO))} min`;
}

/** «hace 3 min»; under a minute «hace un momento»; past an hour «hace 2 h». */
export function haceTiempo(ms: number): string {
  if (ms < MINUTO) return 'hace un momento';
  const min = Math.floor(ms / MINUTO);
  return min < 60 ? `hace ${min} min` : `hace ${Math.floor(min / 60)} h`;
}
