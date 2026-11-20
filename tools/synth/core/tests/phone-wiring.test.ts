import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, it } from 'vitest';

import { holdsMaestroLock, lockedCommand } from '../src/phone/lock';
import { metroEnv } from '../src/phone/metro';
import { phoneMcpConfig } from '../src/phone/run-phone';
import { actorArgs } from '../src/runner/actor-args';
import { PHONE_TOOLS } from '../src/runner/tools';

/** How the phone run is wired: the lock it holds, the bundle it serves, the proxy the actor gets. */
describe('the Maestro lock', () => {
  afterEach(() => {
    delete process.env.MAESTRO_LOCK_OWNER;
  });

  it('runs the command inside a shell that takes the harness lock first and passes the exit code on', () => {
    const { cmd, args } = lockedCommand('/repo', [
      '/bin/node',
      'run-one.ts',
      '--persona',
      'taquero',
    ]);
    assert.equal(cmd, 'bash');
    assert.match(
      args[1] ?? '',
      /source "\/repo\/apps\/mobile\/maestro\/scripts\/lib\/maestro-lock\.sh"/,
    );
    assert.match(args[1] ?? '', /maestro_lock_acquire \|\| exit 1; "\$@"; code=\$\?; exit \$code/);
    assert.deepEqual(args.slice(3), ['/bin/node', 'run-one.ts', '--persona', 'taquero']);
  });

  it('knows it holds the lock only when the harness says so', () => {
    assert.equal(holdsMaestroLock(), false);
    process.env.MAESTRO_LOCK_OWNER = '';
    assert.equal(holdsMaestroLock(), false);
    process.env.MAESTRO_LOCK_OWNER = '4242';
    assert.equal(holdsMaestroLock(), true);
  });
});

describe('metroEnv', () => {
  it('bundles in E2E mode against the corrida’s portal, non-interactively', () => {
    assert.deepEqual(metroEnv('http://10.0.2.2:3901'), {
      CI: '1',
      BROWSER: 'none',
      EXPO_PUBLIC_E2E: '1',
      EXPO_PUBLIC_API_BASE: 'http://10.0.2.2:3901',
    });
  });
});

describe('the phone actor', () => {
  it('starts the Synth proxy, pinned to the device and the run folder, with tsx resolved absolutely', () => {
    const cfg = phoneMcpConfig({ serial: 'emulator-5554', captureDir: '/r/run' }) as {
      mcpServers: Record<string, { command: string; args: string[] }>;
    };
    const server = cfg.mcpServers.phone;
    assert.deepEqual(Object.keys(cfg.mcpServers), ['phone']);
    assert.equal(server?.command, process.execPath);
    assert.equal(server?.args[0], '--import');
    assert.match(server?.args[1] ?? '', /^file:\/\/.*tsx/);
    assert.ok(existsSync(server?.args[2] ?? ''), 'proxy-main.ts exists where the config points');
    assert.deepEqual(server?.args.slice(3), ['--device', 'emulator-5554', '--capture', '/r/run']);
    assert.ok(
      existsSync(fileURLToPath(server?.args[1] ?? '')),
      'tsx resolves from the package, not the empty cwd',
    );
  });

  it('allows the proxy’s three tools and hides every built-in', () => {
    const args = actorArgs({
      model: 'm',
      mcpConfigPath: 'x',
      budgetUsd: 1,
      systemPrompt: '',
      tools: PHONE_TOOLS,
    });
    const after = (f: string) => args[args.indexOf(f) + 1] ?? '';
    assert.deepEqual(after('--allowedTools').split(',').sort(), [
      'mcp__phone__inspect_screen',
      'mcp__phone__run',
      'mcp__phone__take_screenshot',
    ]);
    for (const t of ['Read', 'Bash', 'WebFetch'])
      assert.ok(after('--disallowedTools').split(',').includes(t), t);
  });
});
