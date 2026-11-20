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
export const SERVER = 'pw';

/** What a person can do to a screen: each call is a step, and spends patience. */
export const ACTION_TOOLS = [
  'click',
  'type',
  'fill_form',
  'press_key',
  'select_option',
  'hover',
  'drag',
  'handle_dialog',
  'navigate_back',
] as const;

/** Looking, which is recorded but is not a step. */
export const LOOK_TOOLS = ['snapshot', 'take_screenshot', 'wait_for'] as const;

/**
 * Playwright tools a person does not have (spec §8.1 rule 5): the URL bar,
 * running code, DevTools, other tabs, and the window itself.
 */
const PERSONA_NEVER = [
  'navigate',
  'evaluate',
  'run_code_unsafe',
  'console_messages',
  'network_requests',
  'network_request',
  'find',
  'tabs',
  'resize',
  'emulate_media',
  'file_upload',
  'drop',
  'close',
] as const;

const BUILT_IN = ['Read', 'Edit', 'Write', 'Glob', 'Grep', 'NotebookEdit', 'Bash', 'PowerShell'];
const BUILT_IN_MORE = ['WebFetch', 'WebSearch', 'Task', 'Agent', 'TodoWrite', 'Skill'];

const tool = (t: string): string => `mcp__${SERVER}__browser_${t}`;

export const actionToolName = (name: string): string | undefined =>
  ACTION_TOOLS.find((t) => tool(t) === name);
export const isLookTool = (name: string): boolean => LOOK_TOOLS.some((t) => tool(t) === name);

export interface ActorArgsInput {
  readonly model: string;
  readonly mcpConfigPath: string;
  /** The last guard on spend, in US dollars; the corrida's caps are checked before. */
  readonly budgetUsd: number;
  readonly systemPrompt: string;
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
    [...ACTION_TOOLS, ...LOOK_TOOLS].map(tool).join(','),
    '--disallowedTools',
    [...BUILT_IN, ...BUILT_IN_MORE, ...PERSONA_NEVER.map(tool)].join(','),
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
