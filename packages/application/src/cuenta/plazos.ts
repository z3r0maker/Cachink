/** The clocks of account deletion (ADR-136). */

/** Days between the request and the erase: the undo window. */
export const DIAS_PARA_BORRAR = 30;

/** The reminder goes out this many days before the erase. */
export const DIAS_DE_RECORDATORIO = 3;

const DAY = 86_400_000;

/** Until when the cron looks: anything due for its reminder or its erase. */
export function horizonteDeAvisos(now: Date): string {
  return new Date(now.getTime() + DIAS_DE_RECORDATORIO * DAY).toISOString();
}
