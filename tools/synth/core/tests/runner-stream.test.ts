import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { parseActorReport, StepTracker } from '../src/runner/stream';

/** `claude -p --output-format stream-json` events, as the actor emits them. */
const text = (t: string) => ({
  type: 'assistant',
  message: { content: [{ type: 'text', text: t }] },
});
const use = (id: string, name: string, input: Record<string, unknown>) => ({
  type: 'assistant',
  message: { content: [{ type: 'tool_use', id, name: `mcp__pw__browser_${name}`, input }] },
});
const result = (id: string, body: string, isError = false) => ({
  type: 'user',
  message: {
    content: [
      {
        type: 'tool_result',
        tool_use_id: id,
        content: [{ type: 'text', text: body }],
        is_error: isError,
      },
    ],
  },
});
const PAGE =
  '### Ran Playwright code\nawait page.click()\n### Page\n- Page URL: http://127.0.0.1:4/operador/caja\n- Page Title: Caja\n### Snapshot\n```yaml\n- button "Cobrar"\n```';

describe('StepTracker', () => {
  it('turns each action into a numbered step with the thought before it and what came back', () => {
    const t = new StepTracker();
    t.feed(text('Busco dónde se cobra.'));
    t.feed(use('a', 'click', { element: 'botón Cobrar', ref: 'e12' }));
    const done = t.feed(result('a', PAGE));
    assert.deepEqual(done, {
      n: 1,
      thought: 'Busco dónde se cobra.',
      action: 'click «botón Cobrar»',
      observed: 'Page URL: http://127.0.0.1:4/operador/caja · Page Title: Caja',
      isError: false,
    });
    assert.equal(t.steps.length, 1);
  });

  it('names the element from the code Playwright ran when the actor gave only a ref', () => {
    const t = new StepTracker();
    const ran = (code: string) =>
      `### Ran Playwright code\n\`\`\`js\n${code}\n\`\`\`\n### Page\n- Page URL: http://x/caja`;
    const cases: [string, Record<string, unknown>, string, string][] = [
      [
        'click',
        { target: 'e44' },
        "await page.getByRole('button', { name: 'Abrir turno' }).click();",
        'click «Abrir turno»',
      ],
      [
        'click',
        { target: 'e7' },
        "await page.getByText('Refresco de cola 600 ml').click();",
        'click «Refresco de cola 600 ml»',
      ],
      [
        'type',
        { target: 'e9', text: '500' },
        "await page.getByLabel('Fondo').fill('500');",
        'type «500» into «Fondo»',
      ],
      [
        'click',
        { target: 'e3' },
        "await page.getByTestId('fondo-abrir').click();",
        'click «fondo-abrir»',
      ],
      ['click', { target: 'e5' }, 'nothing readable', 'click «e5»'],
    ];
    cases.forEach(([name, input, code, action], i) => {
      t.feed(use(`r${i}`, name, input));
      assert.equal(t.feed(result(`r${i}`, ran(code)))?.action, action, code);
    });
  });

  it('does not count looking as a step, so a snapshot spends no patience', () => {
    const t = new StepTracker();
    t.feed(use('s', 'snapshot', {}));
    assert.equal(t.feed(result('s', PAGE)), undefined);
    assert.equal(t.steps.length, 0);
    assert.equal(t.looks, 1);
  });

  it('describes typing, keys, forms and choices in words, never by element ref', () => {
    const t = new StepTracker();
    const cases: [string, Record<string, unknown>, string][] = [
      ['type', { element: 'campo Recibido', text: '100' }, 'type «100» into «campo Recibido»'],
      ['press_key', { key: 'Enter' }, 'press «Enter»'],
      [
        'select_option',
        { element: 'Método', values: ['Efectivo'] },
        'choose «Efectivo» in «Método»',
      ],
      ['fill_form', { fields: [{ name: 'Fondo', value: '500' }] }, 'fill «Fondo» = «500»'],
      ['navigate_back', {}, 'go back'],
    ];
    cases.forEach(([name, input, action], i) => {
      t.feed(use(`k${i}`, name, input));
      assert.equal(t.feed(result(`k${i}`, PAGE))?.action, action, name);
    });
  });

  it('keeps a failed action as a step, marked as an error, with the error as what came back', () => {
    const t = new StepTracker();
    t.feed(use('x', 'click', { element: 'Cobrar', ref: 'e9' }));
    const done = t.feed(result('x', '### Error\nTimeout 5000ms exceeded.', true));
    assert.equal(done?.isError, true);
    assert.match(done?.observed ?? '', /Timeout 5000ms exceeded/);
  });

  it('counts assistant turns, and ignores events it does not know', () => {
    const t = new StepTracker();
    t.feed({ type: 'system', subtype: 'init' });
    t.feed(text('a'));
    t.feed(text('b'));
    t.feed({ type: 'something-new' });
    t.feed('not even an object');
    assert.equal(t.turns, 2);
  });

  it('keeps the final result: the report text, usage and estimated cost', () => {
    const t = new StepTracker();
    t.feed({
      type: 'result',
      result: '{"outcome":"completed"}',
      total_cost_usd: 0.4249,
      usage: {
        input_tokens: 10,
        output_tokens: 20,
        cache_read_input_tokens: 30,
        cache_creation_input_tokens: 40,
      },
    });
    assert.equal(t.final?.costCents, 42);
    assert.deepEqual(t.final?.tokens, { input: 10, output: 20, cache_read: 30, cache_write: 40 });
  });
});

describe('parseActorReport', () => {
  const REPORT = {
    outcome: 'abandoned',
    exit_interview: {
      hardest_moments: [
        { step: 3, what: 'no encontré dónde poner el billete' },
        { step: 5, what: 'el botón no hizo nada' },
      ],
      not_understood: 'ninguno',
      expected_missing: 'un botón de cambio',
    },
  };

  it('reads the report from a fenced block or bare JSON, with text around it', () => {
    assert.deepEqual(
      parseActorReport(`Listo.\n\`\`\`json\n${JSON.stringify(REPORT)}\n\`\`\``),
      REPORT,
    );
    assert.deepEqual(parseActorReport(`Me rindo. ${JSON.stringify(REPORT)}`), REPORT);
  });

  it('returns null for no JSON, broken JSON, or a report outside the contract', () => {
    assert.equal(parseActorReport('Ya terminé.'), null);
    assert.equal(parseActorReport('{"outcome": "completed",'), null);
    assert.equal(parseActorReport(JSON.stringify({ ...REPORT, outcome: 'great' })), null);
  });
});
