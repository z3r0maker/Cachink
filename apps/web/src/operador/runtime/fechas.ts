/**
 * The register's clock (O-36): every date and time the device writes or shows
 * is the operator's local one. `toISOString()`'s UTC basis silently splits
 * the day after 18:00 in Mexico — a turno opened at 22:00 CST would carry
 * tomorrow's UTC date and every local-dated row would fall outside its close
 * window. One module, one basis.
 */

const dos = (n: number) => String(n).padStart(2, '0');

/** The device's local date, "YYYY-MM-DD". */
export function hoyLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

/** The device's local time, "HH:MM". */
export function horaLocal(): string {
  const d = new Date();
  return `${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

/** A UTC ISO stamp said in the device's local time, "HH:MM". */
export function hhmmLocal(isoUtc: string): string {
  const d = new Date(isoUtc);
  return Number.isNaN(d.getTime()) ? '' : horaLocalFromDate(d);
}

function horaLocalFromDate(d: Date): string {
  return `${dos(d.getHours())}:${dos(d.getMinutes())}`;
}
