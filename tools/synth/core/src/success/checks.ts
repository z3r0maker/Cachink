import { asTenant } from '@xangarro/testing/tenant';
import { z } from 'zod';

/**
 * A scenario's success is decided by SQL, never by a model (track S §3): each
 * check is a named assertion over the run's tenant, run through the app role
 * so RLS binds it to that tenant, as `withTenant` does in the portal.
 */
interface CheckDef<P extends z.ZodType> {
  readonly params: P;
  readonly run: (biz: string, params: z.infer<P>) => Promise<boolean>;
}

const define = <P extends z.ZodType>(d: CheckDef<P>): CheckDef<P> => d;

const CHECKS = {
  /**
   * Exactly one sale today in the run's tenant, paid in cash, not cancelled,
   * with `partidas` lines. A second ticket fails it: charging twice is a
   * finding, not a success.
   */
  'venta-efectivo': define({
    params: z.strictObject({ partidas: z.number().int().min(1) }),
    run: (biz, { partidas }) =>
      asTenant(biz, async (sql) => {
        const rows = await sql`
          SELECT t.metodo, t.cancelled_at IS NULL AS vigente,
                 (SELECT count(*) FROM sales s WHERE s.ticket_id = t.id AND s.deleted_at IS NULL) AS lineas
          FROM tickets t WHERE t.deleted_at IS NULL`;
        const [only] = rows;
        return (
          rows.length === 1 &&
          only?.metodo === 'Efectivo' &&
          only.vigente === true &&
          Number(only.lineas) === partidas
        );
      }),
  }),
} as const;

export type CheckName = keyof typeof CHECKS;
export const CHECK_NAMES = Object.keys(CHECKS) as CheckName[];

const isCheck = (name: string): name is CheckName => Object.hasOwn(CHECKS, name);

/** The check's parameters, validated; throws naming the check when they do not fit. */
export function checkParams(name: string, params: unknown): unknown {
  if (!isCheck(name))
    throw new Error(`no success check «${name}» (known: ${CHECK_NAMES.join(', ')})`);
  const parsed = CHECKS[name].params.safeParse(params);
  if (!parsed.success)
    throw new Error(`${name}: ${parsed.error.issues.map((i) => i.message).join('; ')}`);
  return parsed.data;
}

/** Runs one check against the run's tenant. */
export async function runCheck(name: string, biz: string, params: unknown): Promise<boolean> {
  const valid = checkParams(name, params);
  const def = CHECKS[name as CheckName] as CheckDef<z.ZodType>;
  return def.run(biz, valid);
}
