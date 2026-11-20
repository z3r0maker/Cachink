import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { judgeSessionProblems, parseJudgeAnswer } from '../src/judge/answer';

const init = (tools: string[], mcp: unknown[] = []) => ({
  type: 'system',
  subtype: 'init',
  tools,
  mcp_servers: mcp,
});
const use = (name: string, input: Record<string, unknown>) => ({
  type: 'assistant',
  message: { content: [{ type: 'tool_use', id: 't', name, input }] },
});
const RUN = '/r/reports/c/runs/x';

describe('judgeSessionProblems', () => {
  it('passes a judge that saw Read, Glob and Grep, no server, and read inside its run', () => {
    const events = [
      init(['Grep', 'Read', 'Glob']),
      use('Read', { file_path: `${RUN}/run.json` }),
      use('Glob', { pattern: 'screenshots/*.png' }),
      use('Grep', { pattern: 'error', path: 'console.jsonl' }),
    ];
    assert.deepEqual(judgeSessionProblems(events, RUN), []);
  });

  it('fails without an init event: what the judge could use is unknown', () => {
    assert.match(judgeSessionProblems([], RUN).join(), /no init event/);
  });

  it('fails a judge that could see a tool beyond reading, or any MCP server', () => {
    const problems = judgeSessionProblems(
      [init(['Read', 'Glob', 'Grep', 'Bash'], [{ name: 'pw' }])],
      RUN,
    );
    assert.match(problems.join(), /Bash/);
    assert.match(problems.join(), /MCP server/);
  });

  it('fails a judge that read outside its run folder, including by climbing out of it', () => {
    const events = [
      init(['Read', 'Glob', 'Grep']),
      use('Read', { file_path: '/r/apps/web/src/page.tsx' }),
      use('Grep', { pattern: 'x', path: '../../other' }),
      use('Read', { file_path: `${RUN}-other/run.json` }),
    ];
    const problems = judgeSessionProblems(events, RUN);
    assert.equal(problems.length, 3);
    assert.match(problems[0] ?? '', /apps\/web/);
  });
});

describe('parseJudgeAnswer', () => {
  it('reads the bare JSON the rubric asks for', () => {
    assert.deepEqual(parseJudgeAnswer('{"findings":[],"dismissed":[]}'), {
      findings: [],
      dismissed: [],
    });
  });

  it('tolerates a fenced block, or a sentence around it', () => {
    const text =
      'Aquí va:\n```json\n{"findings":[],"dismissed":[{"candidate":"C1","reason":"401"}]}\n```\n';
    assert.deepEqual(parseJudgeAnswer(text), {
      findings: [],
      dismissed: [{ candidate: 'C1', reason: '401' }],
    });
  });

  it('refuses an answer with no JSON object', () => {
    assert.throws(() => parseJudgeAnswer('No encontré nada.'), /no JSON object/);
  });

  it('refuses JSON that does not parse', () => {
    assert.throws(() => parseJudgeAnswer('{"findings": [,]}'), /not JSON/);
  });
});
