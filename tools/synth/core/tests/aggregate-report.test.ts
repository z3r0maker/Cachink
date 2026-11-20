import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { groupFindings } from '../src/aggregate/dedupe';
import { runMetrics } from '../src/aggregate/metrics';
import { renderReport, SECTIONS, type ReportInput } from '../src/aggregate/report';
import { finding, PERSONAS, run, steps } from './aggregate-fixtures';

/**
 * Spec §11: the report's order is fixed, `agent_failure` lives only in the
 * appendix, rates appear only as deltas, and nothing reads as a prediction of
 * real users.
 */
const TAQ = run({ persona: 'taquero', scenario: 'primera-venta', steps: steps(9) });
const LUP = run({
  persona: 'lupita',
  scenario: 'primera-venta',
  outcome: 'abandoned',
  success: false,
  steps: steps(4),
});
const FINDINGS = [
  finding({
    run_id: TAQ.id,
    category: 'bug',
    severity: 'major',
    title: 'El total no suma el refresco',
    dedupe_key: 'caja/total/no-suma',
  }),
  finding({ run_id: LUP.id, title: 'Cobrar pide dos toques' }),
  finding({
    run_id: TAQ.id,
    category: 'comprehension',
    title: 'No entiende «fondo de caja»',
    dedupe_key: 'caja/fondo/palabra',
    confidence: 'low',
  }),
  finding({
    run_id: LUP.id,
    category: 'out_of_scope_expectation',
    title: 'Esperaba mandar el ticket por WhatsApp',
    dedupe_key: 'caja/ticket/whatsapp',
  }),
  finding({
    run_id: TAQ.id,
    category: 'agent_failure',
    title: 'El agente tocó un botón tapado',
    dedupe_key: 'caja/abrir-turno/toque-oculto',
  }),
  finding({
    run_id: TAQ.id,
    title: 'Sin evidencia',
    dedupe_key: 'x/y/z',
    evidence: { steps: [], screenshots: [], console: [], network: [] },
  }),
];

function input(over: Partial<ReportInput> = {}): ReportInput {
  const { groups, droppedNoEvidence } = groupFindings(FINDINGS, [TAQ, LUP], PERSONAS);
  return {
    corrida: {
      id: '20261120-1a14',
      started_at: '2026-11-20T01:00:00.000Z',
      mode: 'single',
      app_commit: 'abcdef0123456789abcdef0123456789abcdef01',
      app_dirty: false,
    },
    runs: runMetrics(
      [TAQ, LUP].map((r) => ({ run: r, consoleErrors: 1 })),
      FINDINGS,
      new Map([['primera-venta', 8]]),
    ),
    groups,
    droppedNoEvidence: droppedNoEvidence.length,
    ...over,
  };
}

const sectionOf = (md: string, title: string) => {
  const start = md.indexOf(`## ${title}`);
  const next = md.indexOf('\n## ', start + 1);
  return md.slice(start, next === -1 ? undefined : next);
};

describe('renderReport', () => {
  const md = renderReport(input());

  it('writes the header and the eight sections in spec §11’s order', () => {
    assert.match(md, /Hallazgos generados por agentes sintéticos; son hipótesis hasta verificarse/);
    assert.match(md, /abcdef0/);
    const at = SECTIONS.map((s) => md.indexOf(`## ${s}`));
    assert.ok(
      at.every((i) => i > 0),
      'every section is there',
    );
    assert.deepEqual(
      [...at].sort((a, b) => a - b),
      at,
    );
  });

  it('puts each finding in its section, and agent_failure only in the appendix', () => {
    assert.match(sectionOf(md, 'Bugs'), /El total no suma el refresco/);
    assert.match(sectionOf(md, 'Fricción y comprensión'), /Cobrar pide dos toques/);
    assert.match(sectionOf(md, 'Expectativas fuera de alcance'), /WhatsApp/);
    assert.equal(md.split('El agente tocó un botón tapado').length, 2, 'appears once');
    assert.match(sectionOf(md, 'Apéndice: fallas del agente'), /El agente tocó un botón tapado/);
  });

  it('never shows an evidence-less finding, and says how many were dropped', () => {
    assert.doesNotMatch(md, /Sin evidencia/);
    assert.match(md, /1 hallazgo descartado por no citar la traza/);
  });

  it('shows no rate without a comparable corrida, and rates only in the deltas', () => {
    assert.doesNotMatch(md, /%| pp\b/);
    const withDelta = renderReport(
      input({
        previous: {
          id: '20261119-0001',
          metrics: [{ cell: 'taquero__primera-venta__task', success_points: 50, mean_steps: -2 }],
          findings: { appeared: ['caja/total/no-suma'], gone: [] },
        },
      }),
    );
    const deltas = sectionOf(withDelta, 'Deltas contra la corrida anterior');
    assert.match(deltas, /\+50 pp/);
    assert.equal(withDelta.replace(deltas, '').match(/%| pp\b/), null);
  });

  it('turns low-confidence findings into questions for real users', () => {
    assert.match(sectionOf(md, 'Preguntas para usuarios reales'), /fondo de caja/);
  });

  it('says nothing about satisfaction or liking', () => {
    assert.doesNotMatch(md, /NPS|satisfacci|les gust/i);
  });
});
