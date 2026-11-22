/**
 * Valid examples of each file the harness reads, shared by the schema tests
 * and the tree tests. Each is the spec's example (docs/plan/25-synth-spec.md
 * §6) with track S's corrections (docs/plan/24-synth.md §2).
 */

/** §6.1, with `market_weight` carrying its source (owner decision 12). */
export const LUPITA = {
  id: 'lupita-abarrotes',
  kind: 'human',
  tier: 'core',
  status: 'hypothesis',
  market_weight: { value: 0.3, source: 'estimate' },
  business: { type: 'abarrotes', team: 'solo', formality: 'informal' },
  device: { viewport: [360, 740], network: 'slow-3g', input: 'touch' },
  comparators: ['libreta'],
  goals: ['saber cuánto vendió hoy sin hacer cuentas a mano'],
  knows: ['cobrar, dar cambio, fiar'],
  does_not_know: ['SKU', 'inventario', 'conciliación'],
  behaviors: [
    {
      trait: 'lee solo los botones grandes y salta el texto de ayuda',
      source: 'evidence/playstore-pos-reviews.md#L12',
    },
    { trait: 'si aparece un error en inglés, cierra la app', source: 'hypothesis' },
  ],
  patience: {
    max_steps: 40,
    abandon_triggers: ['le piden un dato que no tiene a la mano (RFC)'],
  },
} as const;

/** §6.2, with a runner and success as named SQL checks. */
export const PRIMERA_VENTA = {
  id: 'primera-venta',
  title: 'Registrar la primera venta del día',
  mission:
    'Acabas de abrir tu negocio. Llega un cliente y se lleva dos productos. Cóbrale en efectivo.',
  runner: 'web',
  start: { seed: 'negocio-con-catalogo-minimo', auth_as: 'operador', url: '/operador/caja' },
  success: [{ check: 'venta-efectivo', params: { partidas: 2 } }],
  optimal_steps: 6,
  interruptions: [],
  applies_to: ['human', 'chaos'],
} as const;

/** §14, with owner decisions 5 and 6, and ADR-154 §4's reaction thresholds. */
export const CONFIG = {
  allowed_hosts: ['127.0.0.1', 'localhost', '10.0.2.2'],
  models: { actor: 'claude-sonnet-5-5', judge: 'claude-opus-5-5', triage: 'claude-opus-5-5' },
  limits: { max_steps: 60, max_turns: 80, run_timeout_s: 900, max_runs_per_corrida: 40 },
  concurrency: { web: 3, phone: 1 },
  estimated_cost_caps: { per_corrida_usd_cents: 2_000, per_day_usd_cents: 5_000 },
  reactions: { doubt_after: 2, stuck_after: 3, patience_stuck_at: 0.75 },
  android: { avd: 'Xangarro_Phone' },
} as const;
