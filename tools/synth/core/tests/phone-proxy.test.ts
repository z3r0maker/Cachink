import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

import { afterEach, beforeEach, describe, it } from 'vitest';

/**
 * The Synth phone proxy as the actor's `claude -p` meets it: a stdio MCP
 * server in front of `maestro mcp` (here a fake that logs what it is asked).
 */
const CORE = join(import.meta.dirname, '..');
const FAKE = join(import.meta.dirname, 'fixtures/fake-maestro-mcp.mjs');

let dir: string;
let proxy: ChildProcess;
let next = 0;
const waiting = new Map<number, (m: { result?: unknown; error?: { message: string } }) => void>();

function call(
  method: string,
  params: unknown = {},
): Promise<{ result?: unknown; error?: { message: string } }> {
  next += 1;
  const id = next;
  proxy.stdin?.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
  return new Promise((resolve) => waiting.set(id, resolve));
}

const maestroLog = () =>
  readFileSync(join(dir, 'maestro.log'), 'utf8')
    .trim()
    .split('\n')
    .map(
      (l) =>
        JSON.parse(l) as {
          method: string;
          params?: { name?: string; arguments?: Record<string, unknown> };
        },
    );

const text = (r: { result?: unknown }) =>
  ((r.result as { content?: { text?: string }[] })?.content ?? []).map((c) => c.text).join('');

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'synth-proxy-'));
  proxy = spawn(
    process.execPath,
    [
      '--import',
      'tsx',
      'src/phone/proxy-main.ts',
      '--device',
      'emulator-5554',
      '--capture',
      dir,
      '--maestro',
      process.execPath,
      '--maestro-arg',
      FAKE,
    ],
    {
      cwd: CORE,
      env: { ...process.env, FAKE_MAESTRO_LOG: join(dir, 'maestro.log') },
      stdio: ['pipe', 'pipe', 'inherit'],
    },
  );
  createInterface({ input: proxy.stdout! }).on('line', (l) => {
    const m = JSON.parse(l) as { id: number };
    waiting.get(m.id)?.(m);
    waiting.delete(m.id);
  });
  await call('initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 't', version: '0' },
  });
});

afterEach(() => {
  proxy.kill();
  rmSync(dir, { recursive: true, force: true });
});

describe('the phone proxy', () => {
  it('shows the actor three tools, none of which asks for a device', async () => {
    const r = await call('tools/list');
    const tools = (r.result as { tools: { name: string; inputSchema: { properties: object } }[] })
      .tools;
    assert.deepEqual(tools.map((t) => t.name).sort(), ['inspect_screen', 'run', 'take_screenshot']);
    for (const t of tools) assert.ok(!('device_id' in t.inputSchema.properties), t.name);
  });

  it('runs an allowed action on the pinned device, and saves the screen after it for the runner', async () => {
    const r = await call('tools/call', { name: 'run', arguments: { yaml: '- tapOn: Cobrar' } });
    assert.match(text(r), /ran run/);
    const run = maestroLog().find((m) => m.params?.name === 'run');
    assert.equal(run?.params?.arguments?.device_id, 'emulator-5554');
    assert.match(
      String(run?.params?.arguments?.yaml),
      /appId: mx\.xangarro\.mobile\n---\n- tapOn: Cobrar/,
    );
    const saved = readdirSync(join(dir, 'hierarchy'));
    assert.deepEqual(saved, ['step-001.json']);
    assert.match(
      readFileSync(join(dir, 'hierarchy', 'step-001.json'), 'utf8'),
      /screen after emulator-5554/,
    );
  });

  it('refuses a command outside the persona’s hands without ever asking Maestro', async () => {
    const r = await call('tools/call', {
      name: 'run',
      arguments: { yaml: '- openLink: exp+xangarro://x' },
    });
    assert.match(text(r), /openLink/);
    assert.equal((r.result as { isError?: boolean }).isError, true);
    assert.ok(!maestroLog().some((m) => m.params?.name === 'run'));
    assert.equal(existsSync(join(dir, 'hierarchy')), false);
  });

  it('refuses a tool it does not show, and a device the actor tries to pick', async () => {
    const cloud = await call('tools/call', { name: 'run_on_cloud', arguments: {} });
    assert.equal((cloud.result as { isError?: boolean }).isError, true);
    const look = await call('tools/call', {
      name: 'inspect_screen',
      arguments: { device_id: 'other-phone' },
    });
    assert.match(text(look), /screen after emulator-5554/);
    assert.ok(!maestroLog().some((m) => m.params?.name === 'run_on_cloud'));
  });

  it('a lone wait is a look: Maestro runs it, but no step is saved', async () => {
    await call('tools/call', { name: 'run', arguments: { yaml: '- waitForAnimationToEnd' } });
    assert.equal(existsSync(join(dir, 'hierarchy')), false);
  });
});
