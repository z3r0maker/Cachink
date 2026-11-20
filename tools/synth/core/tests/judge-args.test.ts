import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { JUDGE_TOOLS, judgeArgs, renderJudgePrompt } from '../src/judge/args';

/**
 * The judge is a model too, and it reads nothing but its run folder (spec
 * §8.3): these pin what it is started with.
 */
describe('judgeArgs', () => {
  const args = judgeArgs({ model: 'claude-opus-5-5', budgetUsd: 2, systemPrompt: 'SP' });
  const after = (f: string) => args[args.indexOf(f) + 1] ?? '';

  it('reads, and only reads: Read, Glob and Grep, confined to its folder by --restricted', () => {
    assert.deepEqual([...JUDGE_TOOLS], ['Read', 'Glob', 'Grep']);
    assert.equal(after('--tools'), 'Read,Glob,Grep');
    assert.equal(after('--allowedTools'), 'Read,Glob,Grep');
    assert.ok(args.includes('--restricted'));
    const denied = after('--disallowedTools').split(',');
    for (const t of ['Bash', 'Write', 'Edit', 'WebFetch', 'WebSearch', 'Task'])
      assert.ok(denied.includes(t), t);
    for (const t of JUDGE_TOOLS) assert.ok(!denied.includes(t), t);
  });

  it('loads no MCP server at all, and saves no session', () => {
    assert.ok(args.includes('--strict-mcp-config'));
    assert.ok(!args.includes('--mcp-config'));
    assert.ok(args.includes('--no-session-persistence'));
    assert.equal(after('--permission-mode'), 'dontAsk');
    assert.equal(after('--model'), 'claude-opus-5-5');
  });

  it('refuses a budget that is not a positive amount', () => {
    assert.throws(() => judgeArgs({ model: 'm', budgetUsd: 0, systemPrompt: '' }), /budget/);
  });
});

describe('renderJudgePrompt', () => {
  const template = 'F:{{files}}\nO:{{outcome}}\nP:{{persona}}\nS:{{scenario}}\nC:{{candidates}}';

  it('fills the run’s files, outcome, persona, scenario and candidates', () => {
    const out = renderJudgePrompt(template, {
      files: ['run.json', 'console.jsonl'],
      outcome: 'completed, success true',
      persona: 'id: taquero',
      scenario: 'id: primera-venta',
      candidates: [{ id: 'C1', source: 'console', ref: 'console.jsonl#L2', text: 'TypeError: x' }],
    });
    assert.match(out, /- `run\.json`\n- `console\.jsonl`/);
    assert.match(out, /O:completed, success true/);
    assert.match(out, /- C1 · `console\.jsonl#L2` · TypeError: x/);
    assert.doesNotMatch(out, /\{\{/);
  });

  it('says so when there are no candidates, rather than leaving the list empty', () => {
    const out = renderJudgePrompt(template, {
      files: [],
      outcome: 'x',
      persona: '',
      scenario: '',
      candidates: [],
    });
    assert.match(out, /C:Ninguno: la consola y la red no registraron errores\./);
  });

  it('refuses a template with a placeholder it does not fill', () => {
    assert.throws(
      () =>
        renderJudgePrompt('{{clima}}', {
          files: [],
          outcome: '',
          persona: '',
          scenario: '',
          candidates: [],
        }),
      /clima/,
    );
  });
});
