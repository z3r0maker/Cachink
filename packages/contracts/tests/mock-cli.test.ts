import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { resolve } from 'node:path';

/**
 * `pnpm mock:api`'s entrypoint: it boots on the port the env names and says
 * where it is; spoken to once over HTTP, then stopped. The default-port side
 * of the `??` needs an env with no PORT at all — 3000 may be taken locally,
 * so that boot is only asserted to speak, never re-fetched.
 */

function boot(
  env: NodeJS.ProcessEnv,
): Promise<{ pid: number; url: string; kill: () => Promise<void> }> {
  return new Promise((resolveBoot, reject) => {
    const p = execFile(
      resolve(process.cwd(), '../../node_modules/.bin/tsx'),
      ['src/mock/cli.ts'],
      { env },
      (error) => {
        if (error && !error.killed) reject(error);
      },
    );
    p.stdout?.on('data', (d: Buffer) => {
      const m = /on (http:\/\/[\d.]+:\d+)/.exec(d.toString());
      if (m) {
        resolveBoot({
          pid: p.pid ?? 0,
          url: m[1] ?? '',
          kill: async () => {
            p.kill('SIGTERM');
            await new Promise((r) => p.once('exit', r));
          },
        });
      }
    });
    p.on('error', reject);
  });
}

describe('the mock:api CLI', () => {
  it('boots on the port the env names and serves a control route', async () => {
    const b = await boot({ ...process.env, PORT: '45993' });
    try {
      expect(b.url).toContain('45993');
      const r = await fetch(`${b.url}/__mock/code`, { method: 'POST' });
      expect(r.status).toBe(200);
    } finally {
      await b.kill();
    }
  }, 20_000);

  it('with no PORT in the env it still speaks its banner', async () => {
    const b = await boot({ PATH: process.env.PATH ?? '', HOME: process.env.HOME ?? '' });
    expect(b.url).toMatch(/:\d+$/);
    await b.kill();
  }, 20_000);
});
