import { parseAllDocuments } from 'yaml';

/**
 * The phone actor's hands (S-06). Maestro's MCP `run` takes any Maestro YAML,
 * and a tool allow-list cannot see inside it, so the Synth proxy checks each
 * call here before Maestro sees it: one thing a person does with a phone in
 * hand, aimed by visible text or by a point on the screen.
 */
const ACTIONS = new Set([
  'tapOn',
  'doubleTapOn',
  'longPressOn',
  'inputText',
  'eraseText',
  'swipe',
  'scroll',
  'back',
  'hideKeyboard',
  'pressKey',
]);
const WAITS = new Set(['waitForAnimationToEnd']);
const KEYS = new Set(['Enter', 'Backspace']);
/** How a tap may be aimed: what the persona sees, never the code's names. */
const SELECTOR_KEYS = new Set(['text', 'point', 'index', 'enabled', 'optional']);
const TAPS = new Set(['tapOn', 'doubleTapOn', 'longPressOn']);

export type PhoneCheck =
  | { readonly ok: true; readonly kind: 'action' | 'look'; readonly commands: readonly Command[] }
  | { readonly ok: false; readonly reason: string };

type Command = {
  readonly name: string;
  readonly arg: unknown;
  /** Keys beside the command in one list item: a mis-indented option. */
  readonly extra: readonly string[];
};

/** The commands of a call: a bare list, one command, or a flow after its `appId` header. */
function commandsOf(yaml: string): Command[] | string {
  const docs = parseAllDocuments(yaml);
  if (!Array.isArray(docs) || docs.some((d) => d.errors.length > 0))
    return 'not YAML Maestro can read';
  const last = docs.at(-1)?.toJS() as unknown;
  const list = Array.isArray(last) ? last : last === null || last === undefined ? [] : [last];
  return list.map((c: unknown) => {
    if (typeof c === 'string') return { name: c, arg: undefined, extra: [] };
    const [first, ...rest] = Object.entries(c as Record<string, unknown>);
    const [name, arg] = first ?? ['', undefined];
    return { name, arg, extra: rest.map(([k]) => k) };
  });
}

/** A tap at bare numbers, like `897,1578`: Maestro would look for that text. */
const PIXELS = /^\s*\d+%?\s*,\s*\d+%?\s*$/;

function shapeIssue(c: Command): string | undefined {
  if (c.extra.length > 0) {
    return `one command per item: put ${c.extra.join(', ')} under ${c.name}, indented, not beside it`;
  }
  if (TAPS.has(c.name) && typeof c.arg === 'string' && PIXELS.test(c.arg)) {
    return 'to tap a place rather than a text, write it as a point: tapOn: { point: 50%,80% }';
  }
  return undefined;
}

function commandIssue(c: Command): string | undefined {
  const shape = shapeIssue(c);
  if (shape !== undefined) return shape;
  if (WAITS.has(c.name)) return undefined;
  if (!ACTIONS.has(c.name)) return `«${c.name}» is not something a person does with the phone`;
  if (c.name === 'pressKey' && !KEYS.has(String(c.arg)))
    return `pressKey «${String(c.arg)}» is not allowed; only Enter and Backspace`;
  if (TAPS.has(c.name) && typeof c.arg === 'object' && c.arg !== null) {
    const bad = Object.keys(c.arg).filter((k) => !SELECTOR_KEYS.has(k));
    if (bad.length > 0) return `aim a tap by visible text or a point, not by ${bad.join(', ')}`;
  }
  return undefined;
}

export function checkPhoneCommand(yaml: string): PhoneCheck {
  const commands = commandsOf(yaml);
  if (typeof commands === 'string') return { ok: false, reason: commands };
  if (commands.length === 0) return { ok: false, reason: 'the call has nothing to do' };
  for (const c of commands) {
    const issue = commandIssue(c);
    if (issue !== undefined) return { ok: false, reason: issue };
  }
  const actions = commands.filter((c) => ACTIONS.has(c.name)).length;
  if (actions > 1) return { ok: false, reason: 'one action per call: a step is one thing done' };
  return { ok: true, kind: actions === 1 ? 'action' : 'look', commands };
}

const target = (arg: unknown): string => {
  if (typeof arg === 'string') return `«${arg}»`;
  const a = (arg ?? {}) as { text?: unknown; point?: unknown };
  return a.text !== undefined ? `«${String(a.text)}»` : `at ${String(a.point)}`;
};

const DESCRIBE: Readonly<Record<string, (arg: unknown) => string>> = {
  tapOn: (a) => `tap ${target(a)}`,
  doubleTapOn: (a) => `double-tap ${target(a)}`,
  longPressOn: (a) => `long-press ${target(a)}`,
  inputText: (a) => `type «${String(a)}»`,
  eraseText: (a) =>
    `erase ${a === undefined || a === null ? '' : `${String(a)} `}characters`.replace('  ', ' '),
  swipe: (a) =>
    `swipe ${String((a as { direction?: unknown } | undefined)?.direction ?? '')}`.trim(),
  scroll: () => 'scroll',
  back: () => 'go back',
  hideKeyboard: () => 'hide the keyboard',
  pressKey: (a) => `press «${String(a)}»`,
};

/** The call's action in words, for the run record. */
export function describePhoneCommand(yaml: string): string {
  const commands = commandsOf(yaml);
  if (typeof commands === 'string') return 'unreadable command';
  const action = commands.find((c) => ACTIONS.has(c.name)) ?? commands[0];
  if (action === undefined) return 'nothing';
  return (DESCRIBE[action.name] ?? ((): string => action.name))(action.arg);
}
