// A stand-in for `maestro mcp`: answers initialize, tools/list and tools/call
// over stdio JSON-RPC, and logs every call it gets to FAKE_MAESTRO_LOG.
import { appendFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const log = process.env.FAKE_MAESTRO_LOG;
const reply = (id, result) =>
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, result })}\n`);
const TOOLS = [
  'list_devices',
  'take_screenshot',
  'run',
  'inspect_screen',
  'cheat_sheet',
  'run_on_cloud',
].map((name) => ({
  name,
  description: name,
  inputSchema: { type: 'object', properties: { device_id: { type: 'string' } } },
}));

createInterface({ input: process.stdin }).on('line', (line) => {
  const m = JSON.parse(line);
  if (log) appendFileSync(log, `${line}\n`);
  if (m.method === 'initialize')
    reply(m.id, {
      protocolVersion: '2025-06-18',
      capabilities: { tools: {} },
      serverInfo: { name: 'maestro', version: '0' },
    });
  if (m.method === 'tools/list') reply(m.id, { tools: TOOLS });
  if (m.method === 'tools/call') {
    const name = m.params.name;
    const text =
      name === 'inspect_screen'
        ? `{"ui":"screen after ${m.params.arguments.device_id}"}`
        : `ran ${name}`;
    reply(m.id, { content: [{ type: 'text', text }] });
  }
});
