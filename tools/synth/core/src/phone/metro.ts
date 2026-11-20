import { spawn } from 'node:child_process';
import { mkdirSync, openSync } from 'node:fs';
import { dirname } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

/**
 * The capture app's bundler for one corrida (S-06): Metro in E2E mode, with
 * the corrida's portal as the API, reached from the emulator at `10.0.2.2`
 * (adb reverse does not survive Maestro restarting adb). `EXPO_PUBLIC_*` are
 * inlined when Metro bundles, which is why each corrida starts its own.
 */
export interface Metro {
  readonly url: string;
  stop(): void;
}

/** The env the bundle is built with: E2E mode and this corrida's API. */
export function metroEnv(apiBase: string): Record<string, string> {
  return { CI: '1', BROWSER: 'none', EXPO_PUBLIC_E2E: '1', EXPO_PUBLIC_API_BASE: apiBase };
}

export async function startMetro(o: {
  readonly repoRoot: string;
  readonly port: number;
  readonly apiBase: string;
  readonly logFile: string;
  readonly timeoutMs?: number;
}): Promise<Metro> {
  mkdirSync(dirname(o.logFile), { recursive: true });
  const log = openSync(o.logFile, 'a');
  const args = [
    '--filter',
    '@xangarro/mobile',
    'exec',
    'expo',
    'start',
    '--dev-client',
    '--port',
    String(o.port),
    '--clear',
  ];
  const child = spawn('pnpm', args, {
    cwd: o.repoRoot,
    env: { ...process.env, ...metroEnv(o.apiBase) },
    detached: true,
    stdio: ['ignore', log, log],
  });
  child.unref();
  const stop = () => {
    try {
      if (child.pid !== undefined) process.kill(-child.pid, 'SIGTERM');
    } catch {
      // Already gone.
    }
  };
  if (await running(o.port, o.timeoutMs ?? 120_000))
    return { url: `http://10.0.2.2:${o.port}`, stop };
  stop();
  throw new Error(`Metro did not start on port ${o.port}; see ${o.logFile}`);
}

/** Whether Metro's packager answers «running» within `timeoutMs`. */
async function running(port: number, timeoutMs: number): Promise<boolean> {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const status = await fetch(`http://127.0.0.1:${port}/status`)
      .then((r) => r.text())
      .catch(() => '');
    if (status.includes('packager-status:running')) return true;
    await sleep(1_000);
  }
  return false;
}
