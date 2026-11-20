import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { parseArgs } from 'node:util';

import { PhoneProxy } from './proxy';

/**
 * The proxy as a process, which the actor's MCP config starts:
 *
 *   node --import tsx proxy-main.ts --device <serial> --capture <dir>
 *        [--app mx.xangarro.mobile] [--maestro maestro] [--maestro-arg mcp …]
 *
 * It starts `maestro mcp` as its child and speaks stdio JSON-RPC on both
 * sides; it ends when the actor closes its input.
 */
const { values } = parseArgs({
  options: {
    device: { type: 'string' },
    capture: { type: 'string' },
    app: { type: 'string', default: 'mx.xangarro.mobile' },
    maestro: { type: 'string', default: 'maestro' },
    'maestro-arg': { type: 'string', multiple: true },
  },
});
if (!values.device || !values.capture) {
  process.stderr.write('usage: proxy-main --device <serial> --capture <dir>\n');
  process.exit(2);
}

const child = spawn(values.maestro, values['maestro-arg'] ?? ['mcp'], {
  stdio: ['pipe', 'pipe', 'inherit'],
});
const write = (stream: NodeJS.WritableStream) => (msg: unknown) =>
  stream.write(`${JSON.stringify(msg)}\n`);
const proxy = new PhoneProxy(
  { device: values.device, captureDir: values.capture, appId: values.app },
  { toClient: write(process.stdout), toChild: write(child.stdin) },
);

const lines = (input: NodeJS.ReadableStream, on: (msg: never) => void) =>
  createInterface({ input }).on('line', (line) => {
    try {
      on(JSON.parse(line) as never);
    } catch {
      // Not JSON-RPC: Maestro's own log lines, which the actor never needs.
    }
  });

lines(process.stdin, (m) => proxy.fromClient(m)).on('close', () => child.kill());
lines(child.stdout, (m) => proxy.fromChild(m));
child.on('exit', (code) => process.exit(code ?? 0));
