import { answeredSteps, WIZARD_STEP_KEYS, WizardAnswersSchema } from '@xangarro/domain';
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
  /**
   * The wizard finished: «Tu plan ideal» chose a plan (`completed_at`), with
   * exactly `pasos` of the eight steps answered. Camino A answers all eight;
   * camino B skips every one.
   */
  'onboarding-terminado': define({
    params: z.strictObject({ pasos: z.number().int().min(0).max(WIZARD_STEP_KEYS.length) }),
    run: (biz, { pasos }) =>
      asTenant(biz, async (sql) => {
        const [row] = await sql`SELECT answers, completed_at FROM business_onboarding`;
        const answers = WizardAnswersSchema.safeParse(row?.answers);
        return (
          row?.completed_at != null && answers.success && answeredSteps(answers.data) === pasos
        );
      }),
  }),
  /**
   * The day's one turno closed with `contado` centavos counted and nothing
   * left over or missing. A difference is a finding for the judge, not a corte.
   */
  'corte-cuadrado': define({
    params: z.strictObject({ contado: z.number().int().min(0) }),
    run: (biz, { contado }) =>
      asTenant(biz, async (sql) => {
        const rows = await sql`
          SELECT cierre_at, monto_cierre_centavos::text AS contado, diferencia_centavos::text AS diferencia
          FROM caja_turnos WHERE deleted_at IS NULL`;
        const [only] = rows;
        return (
          rows.length === 1 &&
          only?.cierre_at != null &&
          centavos(only.contado) === BigInt(contado) &&
          centavos(only.diferencia) === 0n
        );
      }),
  }),
} as const;

/** A centavos column read as text, parsed (CLAUDE.md §2.8): null for a missing value. */
function centavos(text: unknown): bigint | null {
  return typeof text === 'string' && /^-?\d+$/.test(text) ? BigInt(text) : null;
}

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
