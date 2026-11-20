import type { PersonaFacts } from '../src/aggregate/dedupe';
import type { Finding } from '../src/schemas/finding';
import type { Run } from '../src/schemas/run';

/** Small builders for the aggregation tests: a run, a finding and the personas they belong to. */
export function run(over: Partial<Run> & Pick<Run, 'persona' | 'scenario'>): Run {
  const style = over.style ?? 'task';
  const repetition = over.repetition ?? 1;
  return {
    id: `${over.persona}__${over.scenario}__${style}__r${repetition}`,
    style,
    repetition,
    runner: 'web',
    outcome: 'completed',
    success: true,
    checks: [],
    steps: [],
    looks: 0,
    tokens: { input: 0, output: 0, cache_read: 0, cache_write: 0 },
    estimated_cost_usd_cents: 10,
    duration_ms: 1_000,
    started_at: '2026-11-20T01:00:00.000Z',
    ...over,
  };
}

export const steps = (n: number): Run['steps'] =>
  Array.from({ length: n }, (_, i) => ({
    n: i + 1,
    thought: '',
    action: 'tap',
    observed: '',
    fingerprint: `f${i}`,
  }));

let next = 1;
export function finding(over: Partial<Finding> & Pick<Finding, 'run_id'>): Finding {
  const id = `F-2026-11-20-${String(next++).padStart(3, '0')}`;
  return {
    id,
    category: 'friction',
    severity: 'minor',
    title: 'Cobrar pide dos toques',
    description: 'Hay que tocar Cobrar dos veces.',
    evidence: { steps: [3], screenshots: [], console: [], network: [] },
    persona_status: 'hypothesis',
    repro: 'Agregar un producto y tocar Cobrar.',
    confidence: 'medium',
    dedupe_key: 'caja/cobrar/dos-toques',
    ...over,
  };
}

export const PERSONAS: ReadonlyMap<string, PersonaFacts> = new Map([
  ['taquero', { market_weight: 0.3, status: 'hypothesis' }],
  ['lupita', { market_weight: 0.5, status: 'grounded' }],
]);
