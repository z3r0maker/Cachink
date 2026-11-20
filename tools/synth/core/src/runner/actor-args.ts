/**
 * How the actor is started (ADR-153 §6): `claude -p` in an empty folder, with
 * one MCP server (Playwright, attached to the runner's browser) and the
 * persona's tools only. Verified against Claude Code 2.1.283 on 2026-11-19:
 *
 * - `--restricted` ignores user, project and local settings (no hooks, no
 *   plugins) and drops the code-running tools; `--strict-mcp-config` skips
 *   every MCP server but ours.
 * - `--tools ""` alone does not remove the file tools, so every built-in is
 *   also on `--disallowedTools`, which takes a tool out of the model's view.
 * - `--safe-mode` would drop `--mcp-config` too, and `--bare` never reads the
 *   Claude Code login (owner decision 6), so neither is used.
 * - This CLI has no `--max-turns`; the runner counts turns and steps itself
 *   and stops the actor, with `--max-budget-usd` as the last guard.
 */
import { SERVER, WEB_TOOLS, type ToolSet } from './tools';

export { ACTION_TOOLS, LOOK_TOOLS, SERVER } from './tools';

/** Claude Code's built-in tools: the actor gets none of them; the judge gets the three that read. */
export const BUILT_INS = [
  'Read',
  'Edit',
  'Write',
  'Glob',
  'Grep',
  'NotebookEdit',
  'Bash',
  'PowerShell',
  'WebFetch',
  'WebSearch',
  'Task',
  'Agent',
  'TodoWrite',
  'Skill',
] as const;

export interface ActorArgsInput {
  readonly model: string;
  readonly mcpConfigPath: string;
  /** The last guard on spend, in US dollars; the corrida's caps are checked before. */
  readonly budgetUsd: number;
  readonly systemPrompt: string;
  /** The runner's tools; the web's by default. */
  readonly tools?: ToolSet;
}

export function actorArgs(i: ActorArgsInput): string[] {
  if (!(i.budgetUsd > 0))
    throw new Error(`the actor's budget must be a positive amount, not ${i.budgetUsd}`);
  return [
    '-p',
    '--output-format',
    'stream-json',
    '--verbose',
    '--no-session-persistence',
    '--model',
    i.model,
    '--max-budget-usd',
    String(i.budgetUsd),
    '--restricted',
    '--strict-mcp-config',
    '--mcp-config',
    i.mcpConfigPath,
    '--tools',
    '',
    '--allowedTools',
    (i.tools ?? WEB_TOOLS).allowed.join(','),
    '--disallowedTools',
    [...BUILT_INS, ...(i.tools ?? WEB_TOOLS).never].join(','),
    '--permission-mode',
    'dontAsk',
    '--system-prompt',
    i.systemPrompt,
  ];
}

export interface McpConfig {
  readonly mcpServers: Record<
    string,
    { readonly command: string; readonly args: readonly string[] }
  >;
}

/** Playwright MCP on the runner's own Chromium (ADR-153 §5: the runner owns the browser). */
export function mcpConfig(i: {
  readonly node: string;
  readonly cli: string;
  readonly cdpUrl: string;
}): McpConfig {
  const host = new URL(i.cdpUrl).hostname;
  if (host !== '127.0.0.1' && host !== 'localhost') {
    throw new Error(`the browser's CDP endpoint must be on loopback, not ${host}`);
  }
  return {
    mcpServers: {
      [SERVER]: {
        command: i.node,
        args: [i.cli, '--cdp-endpoint', i.cdpUrl, '--block-service-workers'],
      },
    },
  };
}
