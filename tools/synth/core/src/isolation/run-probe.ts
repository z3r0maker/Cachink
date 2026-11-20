import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { phoneMcpConfig } from '../phone/run-phone';
import { actorArgs, mcpConfig } from '../runner/actor-args';
import { runActor } from '../runner/actor-process';
import { PHONE_TOOLS, WEB_TOOLS, type ToolSet } from '../runner/tools';
import { startCanary, type Canary } from './canary';
import { isolationVerdict, PROBE_SYSTEM_PROMPT, probePrompt, type IsolationVerdict } from './probe';

/**
 * One isolation probe for one runner: the actor started with the very flags
 * and MCP server a run gives it (`actorArgs`, Playwright MCP or the Synth phone
 * proxy), against fresh canaries. The phone's proxy sits over a null Maestro,
 * so no device or Maestro lock is touched.
 */
const NULL_MAESTRO = fileURLToPath(new URL('./null-maestro.ts', import.meta.url));

export interface ProbeOptions {
  readonly runner: 'web' | 'phone';
  readonly model: string;
  readonly outDir: string;
  /** Playwright MCP's CLI, for the web probe. */
  readonly mcpCli: string;
}

function mcpFor(o: ProbeOptions): { config: unknown; tools: ToolSet } {
  if (o.runner === 'web') {
    // A CDP endpoint nothing listens on: the probe needs the tools, not a page.
    return {
      config: mcpConfig({ node: process.execPath, cli: o.mcpCli, cdpUrl: 'http://127.0.0.1:9' }),
      tools: WEB_TOOLS,
    };
  }
  const maestro = {
    command: process.execPath,
    args: ['--import', import.meta.resolve('tsx'), NULL_MAESTRO],
  };
  return {
    config: phoneMcpConfig({ serial: 'isolation-probe', captureDir: o.outDir, maestro }),
    tools: PHONE_TOOLS,
  };
}

/** The verdict over the transcript, saved beside it. */
function judge(
  streamFile: string,
  tools: ToolSet,
  canary: Canary,
  outDir: string,
): IsolationVerdict {
  const events = readFileSync(streamFile, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l) as unknown);
  const verdict = isolationVerdict(events, tools, {
    tokens: [canary.fileToken, canary.urlToken],
    serverHits: canary.hits(),
  });
  writeFileSync(join(outDir, 'verdict.json'), `${JSON.stringify(verdict, null, 2)}\n`);
  return verdict;
}

export async function runProbe(o: ProbeOptions): Promise<IsolationVerdict> {
  mkdirSync(o.outDir, { recursive: true });
  const canary = await startCanary();
  const empty = mkdtempSync(join(tmpdir(), 'synth-actor-'));
  const { config, tools } = mcpFor(o);
  const mcpPath = join(o.outDir, 'mcp.json');
  writeFileSync(mcpPath, `${JSON.stringify(config, null, 2)}\n`);
  const streamFile = join(o.outDir, 'actor.stream.jsonl');
  writeFileSync(streamFile, '');
  try {
    await runActor({
      command: 'claude',
      args: actorArgs({
        model: o.model,
        mcpConfigPath: mcpPath,
        budgetUsd: 1,
        systemPrompt: PROBE_SYSTEM_PROMPT,
        tools,
      }),
      prompt: probePrompt({ file: canary.file, url: canary.url, runner: o.runner }),
      cwd: empty,
      maxSteps: 20,
      maxTurns: 40,
      timeoutMs: 300_000,
      onStep: async () => undefined,
      streamFile,
      tools,
    });
    return judge(streamFile, tools, canary, o.outDir);
  } finally {
    await canary.close();
    rmSync(empty, { recursive: true, force: true });
  }
}
