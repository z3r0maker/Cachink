// A stand-in for `claude -p --output-format stream-json`: prints the events a
// real actor would, as told by FAKE_ACTOR (steps | hang | crash | noreport).
const mode = process.env.FAKE_ACTOR ?? 'steps';
const steps = Number(process.env.FAKE_STEPS ?? '2');
const out = (e) => process.stdout.write(`${JSON.stringify(e)}\n`);

process.stdout.write('[claude-code:unrecognized_model] {"model":"x"}\n');
out({ type: 'system', subtype: 'init' });
if (mode === 'crash') {
  process.stderr.write('fatal: no login\n');
  process.exit(3);
}
for (let n = 1; n <= steps; n += 1) {
  out({ type: 'assistant', message: { content: [{ type: 'text', text: `paso ${n}` }] } });
  out({
    type: 'assistant',
    message: {
      content: [
        {
          type: 'tool_use',
          id: `t${n}`,
          name: 'mcp__pw__browser_click',
          input: { element: `botón ${n}` },
        },
      ],
    },
  });
  out({
    type: 'user',
    message: {
      content: [
        { type: 'tool_result', tool_use_id: `t${n}`, content: '- Page URL: http://127.0.0.1/x' },
      ],
    },
  });
}
if (mode === 'hang') setInterval(() => {}, 1000);
else {
  const report = {
    outcome: 'completed',
    exit_interview: { hardest_moments: [], not_understood: 'ninguno', expected_missing: 'nada' },
  };
  out({
    type: 'result',
    result: mode === 'noreport' ? 'Listo.' : JSON.stringify(report),
    total_cost_usd: 0.12,
    usage: {},
  });
}
