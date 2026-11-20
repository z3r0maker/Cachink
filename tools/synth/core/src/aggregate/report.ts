import type { Corrida } from '../schemas/corrida';
import type { FindingGroup } from './dedupe';
import type { MetricDelta, RunMetric } from './metrics';
import { groupItem, runsTable, SEVERITY_ES } from './report-items';

/**
 * `report.md` (spec §11), in its fixed order. Findings are hypotheses, so the
 * report never predicts real users: no satisfaction, no NPS, and a success
 * rate only as its change against a comparable corrida. `agent_failure` is
 * an appendix for improving the harness, never part of the prioritised list.
 */
export const SECTIONS = [
  'Sensibilidad del arnés',
  'Bugs',
  'Fricción y comprensión',
  'Expectativas fuera de alcance',
  'Deltas contra la corrida anterior',
  'Apéndice: fallas del agente',
  'Preguntas para usuarios reales',
] as const;

export interface ReportInput {
  /** What `corrida.json` says; a corrida from before S-09 has only its id and start. */
  readonly corrida: Pick<Corrida, 'id' | 'started_at'> &
    Partial<Pick<Corrida, 'mode' | 'app_commit' | 'app_dirty'>>;
  readonly runs: readonly RunMetric[];
  readonly groups: readonly FindingGroup[];
  readonly droppedNoEvidence: number;
  readonly previous?: {
    readonly id: string;
    readonly metrics: readonly MetricDelta[];
    readonly findings: { readonly appeared: readonly string[]; readonly gone: readonly string[] };
  };
}

const LEGEND = '> Hallazgos generados por agentes sintéticos; son hipótesis hasta verificarse.';

function header(i: ReportInput): string {
  const c = i.corrida;
  const commit =
    c.app_commit === undefined
      ? 'desconocido (corrida anterior a `corrida.json`)'
      : `\`${c.app_commit.slice(0, 7)}\`${c.app_dirty === true ? ', con cambios sin commit' : ''}`;
  const dropped =
    i.droppedNoEvidence === 0
      ? ''
      : `\n\n${i.droppedNoEvidence} ${i.droppedNoEvidence === 1 ? 'hallazgo descartado' : 'hallazgos descartados'} por no citar la traza.`;
  return (
    [
      `# Corrida ${c.id}`,
      '',
      `**Fecha:** ${c.started_at.slice(0, 10)} · **Commit de la app:** ${commit} · **Modo:** ${c.mode ?? 'single'} · **Runs:** ${i.runs.length}`,
      '',
      LEGEND,
      '',
      runsTable(i.runs),
    ].join('\n') + dropped
  );
}

const items = (gs: readonly FindingGroup[], priority: boolean, none: string) =>
  gs.length === 0 ? none : gs.map((g) => groupItem(g, { priority })).join('\n\n');

function bugs(groups: readonly FindingGroup[]): string {
  const found = groups.filter((g) => g.category === 'bug');
  if (found.length === 0) return 'Ningún bug con evidencia en esta corrida.';
  return (['critical', 'major', 'minor'] as const)
    .flatMap((s) => {
      const of = found.filter((g) => g.severity === s);
      return of.length === 0 ? [] : [`**Severidad ${SEVERITY_ES[s]}**\n\n${items(of, false, '')}`];
    })
    .join('\n\n');
}

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

function deltas(i: ReportInput): string {
  const p = i.previous;
  if (p === undefined) return 'No hay una corrida anterior comparable.';
  const rows = p.metrics.map(
    (d) => `| \`${d.cell}\` | ${signed(d.success_points)} pp | ${signed(d.mean_steps)} |`,
  );
  const keys = (label: string, ks: readonly string[]) =>
    `**${label}:** ${ks.length === 0 ? 'ninguno' : ks.map((k) => `\`${k}\``).join(', ')}`;
  return [
    `Contra \`${p.id}\`.`,
    '',
    '| Persona × escenario | Éxito | Pasos medios |',
    '| --- | --- | --- |',
    ...rows,
    '',
    keys('Hallazgos nuevos', p.findings.appeared),
    '',
    keys('Ya no aparecen', p.findings.gone),
  ].join('\n');
}

function questions(groups: readonly FindingGroup[]): string {
  const low = groups.filter((g) => g.confidence === 'low' && g.category !== 'agent_failure');
  if (low.length === 0) return 'Ningún hallazgo de baja confianza.';
  return low
    .map((g) => `- ¿A una persona real le pasa esto? «${g.title}». Para verlo: ${g.repro}`)
    .join('\n');
}

export function renderReport(i: ReportInput): string {
  const of = (...cs: FindingGroup['category'][]) => i.groups.filter((g) => cs.includes(g.category));
  const bodies = [
    'Sin medición todavía: esta corrida no sembró bugs, así que no hay recall que informar.',
    bugs(i.groups),
    items(of('friction', 'comprehension'), true, 'Ninguna en esta corrida.'),
    items(of('out_of_scope_expectation'), true, 'Ninguna en esta corrida.'),
    deltas(i),
    items(of('agent_failure'), false, 'Ninguna en esta corrida.'),
    questions(i.groups),
  ];
  const sections = SECTIONS.map((title, n) => `## ${title}\n\n${bodies[n] ?? ''}`);
  return `${[header(i), ...sections].join('\n\n')}\n`;
}
