import { createInterface } from 'node:readline';

/**
 * A Maestro MCP that drives nothing (S-07). The isolation probe puts it behind
 * the real Synth proxy, so the actor meets the phone's exact tools while no
 * emulator, driver or Maestro lock is touched. Every tool call answers that
 * there is no device.
 */
const reply = (id: unknown, result: unknown) =>
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, result })}\n`);

createInterface({ input: process.stdin }).on('line', (line) => {
  let m: { id?: unknown; method?: string };
  try {
    m = JSON.parse(line) as { id?: unknown; method?: string };
  } catch {
    return;
  }
  if (m.method === 'initialize') {
    reply(m.id, {
      protocolVersion: '2025-06-18',
      capabilities: { tools: {} },
      serverInfo: { name: 'null-maestro', version: '0' },
    });
  } else if (m.method === 'tools/list') {
    reply(m.id, { tools: [] });
  } else if (m.method === 'tools/call') {
    reply(m.id, {
      content: [{ type: 'text', text: 'No device in an isolation probe.' }],
      isError: true,
    });
  }
});
