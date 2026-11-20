import { checkPhoneCommand, describePhoneCommand } from '../phone/allow';
import { describeAction } from './describe';

/**
 * A runner's tools as the actor sees them: which it may call, which of its
 * server's it may never see, and which calls are steps (an action, which
 * spends patience) or looks. The web actor drives Playwright MCP (S-05); the
 * phone actor drives Maestro MCP through the Synth proxy (S-06).
 */
export interface ToolSet {
  readonly server: string;
  /** Full MCP names the actor may call. */
  readonly allowed: readonly string[];
  /** Full names of the server's tools the actor never sees. */
  readonly never: readonly string[];
  /** `action` (a step), `look`, or `undefined` for a tool that is not the persona's. */
  kind(name: string, input: Readonly<Record<string, unknown>>): 'action' | 'look' | undefined;
  /** The call in words, once its result (where Playwright shows the code it ran) is in. */
  describe(name: string, input: Readonly<Record<string, unknown>>, resultText: string): string;
}

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

const pw = (t: string): string => `mcp__${SERVER}__browser_${t}`;
const short = (name: string): string => name.replace(`mcp__${SERVER}__browser_`, '');

export const WEB_TOOLS: ToolSet = {
  server: SERVER,
  allowed: [...ACTION_TOOLS, ...LOOK_TOOLS].map(pw),
  never: PERSONA_NEVER.map(pw),
  kind: (name) => {
    const t = short(name);
    if ((ACTION_TOOLS as readonly string[]).includes(t) && name === pw(t)) return 'action';
    if ((LOOK_TOOLS as readonly string[]).includes(t) && name === pw(t)) return 'look';
    return undefined;
  },
  describe: (name, input, resultText) => describeAction(short(name), input, resultText),
};

export const PHONE_SERVER = 'phone';
const ph = (t: string): string => `mcp__${PHONE_SERVER}__${t}`;

export const PHONE_TOOLS: ToolSet = {
  server: PHONE_SERVER,
  allowed: ['run', 'inspect_screen', 'take_screenshot'].map(ph),
  // The proxy shows only those three, so there is nothing of its own to hide.
  never: [],
  kind: (name, input) => {
    if (name === ph('inspect_screen') || name === ph('take_screenshot')) return 'look';
    if (name !== ph('run')) return undefined;
    // A command the proxy refuses never reaches the phone: it is the actor
    // fumbling the tool, not the persona doing something, so it spends no
    // patience. max_turns still bounds an actor that keeps fumbling.
    const check = checkPhoneCommand(String(input.yaml ?? ''));
    return check.ok ? check.kind : 'look';
  },
  describe: (_name, input) => describePhoneCommand(String(input.yaml ?? '')),
};
