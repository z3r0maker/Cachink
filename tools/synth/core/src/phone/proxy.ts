import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { checkPhoneCommand } from './allow';

/**
 * The Synth phone proxy (S-06): the actor's only MCP server, in front of
 * `maestro mcp`. It shows three tools, pins every call to the corrida's
 * device, refuses any command outside the persona's hands (`allow.ts`) before
 * Maestro sees it, and after each action saves the screen's hierarchy as
 * `<capture>/hierarchy/step-NNN.json`, the runner's fingerprint source,
 * before it answers. Anything else the client sends passes through.
 */
export interface ProxyOptions {
  readonly device: string;
  readonly captureDir: string;
  readonly appId: string;
}

type Msg = {
  readonly id?: number | string;
  readonly method?: string;
  readonly params?: Record<string, unknown>;
} & Record<string, unknown>;

export interface ProxyIO {
  toClient(msg: unknown): void;
  toChild(msg: unknown): void;
}

const NO_ARGS = { type: 'object', properties: {}, additionalProperties: false };

export const PHONE_TOOLS_SHOWN = [
  {
    name: 'run',
    description:
      'Do one thing on the phone, written as one Maestro command: tapOn (by the visible text, or a point like 50%,80%), doubleTapOn, longPressOn, inputText, eraseText, swipe, scroll, back, hideKeyboard, pressKey (Enter or Backspace). One action per call; waitForAnimationToEnd may follow it.',
    inputSchema: {
      type: 'object',
      properties: { yaml: { type: 'string' } },
      required: ['yaml'],
      additionalProperties: false,
    },
  },
  {
    name: 'inspect_screen',
    description: 'What is on the phone screen now: its texts and controls.',
    inputSchema: NO_ARGS,
  },
  {
    name: 'take_screenshot',
    description: 'A picture of the phone screen now.',
    inputSchema: NO_ARGS,
  },
] as const;

const refusal = (id: Msg['id'], text: string) => ({
  jsonrpc: '2.0',
  id,
  result: { content: [{ type: 'text', text }], isError: true },
});

export class PhoneProxy {
  private next = 0;
  private steps = 0;
  private readonly pending = new Map<string, (msg: Msg) => void>();

  constructor(
    private readonly o: ProxyOptions,
    private readonly io: ProxyIO,
  ) {}

  fromClient(msg: Msg): void {
    if (msg.method === 'tools/list') {
      this.io.toClient({ jsonrpc: '2.0', id: msg.id, result: { tools: PHONE_TOOLS_SHOWN } });
      return;
    }
    if (msg.method === 'tools/call') {
      this.call(msg);
      return;
    }
    this.io.toChild(msg);
  }

  fromChild(msg: Msg): void {
    const key = String(msg.id);
    const handler = this.pending.get(key);
    if (handler === undefined) {
      this.io.toClient(msg);
      return;
    }
    this.pending.delete(key);
    handler(msg);
  }

  /** Sends a call of the proxy's own to Maestro, on the pinned device. */
  private ask(name: string, args: Record<string, unknown>, then: (msg: Msg) => void): void {
    this.next += 1;
    const id = `synth-${this.next}`;
    this.pending.set(id, then);
    this.io.toChild({
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: { name, arguments: { ...args, device_id: this.o.device } },
    });
  }

  private answer(clientId: Msg['id'], child: Msg): void {
    this.io.toClient({ ...child, id: clientId });
  }

  private call(msg: Msg): void {
    const name = String(msg.params?.name ?? '');
    if (name === 'inspect_screen' || name === 'take_screenshot') {
      this.ask(name, {}, (r) => this.answer(msg.id, r));
      return;
    }
    if (name !== 'run') {
      this.io.toClient(refusal(msg.id, `«${name}» is not one of this phone's tools`));
      return;
    }
    const yaml = String((msg.params?.arguments as { yaml?: unknown } | undefined)?.yaml ?? '');
    const check = checkPhoneCommand(yaml);
    if (!check.ok) {
      this.io.toClient(refusal(msg.id, check.reason));
      return;
    }
    const flow = /^\s*appId:/m.test(yaml) ? yaml : `appId: ${this.o.appId}\n---\n${yaml}`;
    this.ask('run', { yaml: flow }, (r) => {
      if (check.kind === 'look') return this.answer(msg.id, r);
      this.afterAction(() => this.answer(msg.id, r));
    });
  }

  /** The screen after an action, saved before the actor hears back. */
  private afterAction(done: () => void): void {
    this.steps += 1;
    const n = String(this.steps).padStart(3, '0');
    this.ask('inspect_screen', {}, (r) => {
      const dir = join(this.o.captureDir, 'hierarchy');
      mkdirSync(dir, { recursive: true });
      const content = (r.result as { content?: { text?: string }[] } | undefined)?.content ?? [];
      writeFileSync(join(dir, `step-${n}.json`), content.map((c) => c.text ?? '').join('\n'));
      done();
    });
  }
}
