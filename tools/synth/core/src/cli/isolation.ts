import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { parse } from 'yaml';

import { renderRecord, type ProbeRecord } from '../isolation/record';
import { runProbe } from '../isolation/run-probe';
import { PHONE_TOOLS, WEB_TOOLS } from '../runner/tools';
import { ConfigSchema } from '../schemas/config';
import { reportsDir } from '../stack/names';

/**
 * `pnpm --filter @xangarro/synth-core isolation` (S-07): probes the web and the
 * phone actor, writes their transcripts and verdicts under
 * `tools/synth/reports/isolation-<date>/`, and `tools/synth/isolation.md`, the
 * committed record the README cites. Exits 1 when either actor got out.
 */
const REPO = resolve(import.meta.dirname, '../../../../..');
const SYNTH = join(REPO, 'tools/synth');
const MCP_PKG = join(SYNTH, 'vendor/playwright-mcp/node_modules/@playwright/mcp');

async function main(): Promise<void> {
  if (!existsSync(MCP_PKG)) throw new Error('run `pnpm --filter @xangarro/synth-core setup` first');
  const config = ConfigSchema.parse(parse(readFileSync(join(SYNTH, 'config.yaml'), 'utf8')));
  const date = new Date().toISOString().slice(0, 10);
  const base = join(reportsDir(REPO), `isolation-${date}`);
  const records: ProbeRecord[] = [];
  for (const [runner, tools] of [
    ['web', WEB_TOOLS],
    ['phone', PHONE_TOOLS],
  ] as const) {
    const outDir = join(base, runner);
    const verdict = await runProbe({
      runner,
      model: config.models.actor,
      outDir,
      mcpCli: join(MCP_PKG, 'cli.js'),
    });
    records.push({
      runner,
      tools,
      verdict,
      transcript: relative(REPO, join(outDir, 'actor.stream.jsonl')),
    });
    process.stdout.write(
      `${runner}: ${verdict.ok ? 'isolated' : `NOT isolated: ${verdict.problems.join('; ')}`}\n`,
    );
  }
  const meta = {
    date,
    claudeVersion: execFileSync('claude', ['--version']).toString().trim(),
    playwrightMcp: (
      JSON.parse(readFileSync(join(MCP_PKG, 'package.json'), 'utf8')) as { version: string }
    ).version,
    model: config.models.actor,
  };
  writeFileSync(join(SYNTH, 'isolation.md'), renderRecord(meta, records));
  if (records.some((r) => !r.verdict.ok)) process.exit(1);
}

main().catch((e: unknown) => {
  process.stderr.write(`${e instanceof Error ? (e.stack ?? e.message) : String(e)}\n`);
  process.exit(1);
});
