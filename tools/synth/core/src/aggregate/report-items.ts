import type { Finding } from '../schemas/finding';
import type { FindingGroup } from './dedupe';
import type { RunMetric } from './metrics';

/**
 * How one finding group and one run read in `report.md`. Spanish, as the
 * spec's own report wording; every piece of evidence links into `runs/`.
 */
export const SEVERITY_ES = { critical: 'crítico', major: 'mayor', minor: 'menor' } as const;
const CONFIDENCE_ES = { high: 'alta', medium: 'media', low: 'baja' } as const;
const CATEGORY_ES: Record<Finding['category'], string> = {
  bug: 'bug',
  friction: 'fricción',
  comprehension: 'comprensión',
  agent_failure: 'falla del agente',
  out_of_scope_expectation: 'fuera de alcance',
};

function citations(runId: string, e: Finding['evidence']): string {
  const link = (label: string, path: string) => `[${label}](runs/${runId}/${path})`;
  const parts = [
    e.steps.length > 0 ? `pasos ${e.steps.join(', ')}` : '',
    ...e.screenshots.map((s) => link(s, s)),
    ...[...e.console, ...e.network].map((ref) => link(ref, ref.replace(/#L\d+$/, ''))),
  ].filter(Boolean);
  return `\`${runId}\`: ${parts.join(' · ')}`;
}

export function groupItem(g: FindingGroup, opts: { readonly priority: boolean }): string {
  const facts = [
    `\`${g.key}\``,
    CATEGORY_ES[g.category],
    SEVERITY_ES[g.severity],
    `confianza ${CONFIDENCE_ES[g.confidence]}`,
    `personas: ${g.personas.join(', ')} (${g.personaStatus})`,
    ...(opts.priority ? [`prioridad ${g.priority}`] : []),
    ...(g.seenIn.of > 1 ? [`apareció en ${g.seenIn.runs} de ${g.seenIn.of} runs`] : []),
  ];
  return [
    `### ${g.title}`,
    '',
    facts.join(' · '),
    '',
    g.description,
    '',
    `**Reproducir:** ${g.repro}`,
    '',
    '**Evidencia:**',
    '',
    ...g.evidence.map((e) => `- ${citations(e.runId, e.evidence)}`),
  ].join('\n');
}

const OUTCOME_ES: Record<RunMetric['outcome'], string> = {
  completed: 'completó',
  abandoned: 'abandonó',
  blocked: 'bloqueado',
  error: 'error del arnés',
};

const yesNo = (b: boolean | null) => (b === null ? '—' : b ? 'sí' : 'no');

export function runsTable(runs: readonly RunMetric[]): string {
  const rows = runs.map((m) =>
    [
      `\`${m.run_id}\``,
      OUTCOME_ES[m.outcome],
      yesNo(m.success),
      `${m.steps} / ${m.optimal_steps}`,
      m.abandon_step === null ? '—' : String(m.abandon_step),
      String(m.console_errors),
      String(m.agent_failures),
    ].join(' | '),
  );
  return [
    '| Run | Resultado | Verificación SQL | Pasos / óptimo | Abandono en | Errores de consola | Fallas del agente |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map((r) => `| ${r} |`),
  ].join('\n');
}
