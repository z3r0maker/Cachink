import { z } from 'zod';

import { ExitInterview } from '../schemas/run';
import { actionToolName, isLookTool } from './actor-args';
import { asText, describeAction, describeObserved } from './describe';

/**
 * Reads the actor's `claude -p --output-format stream-json` events as they
 * arrive. Each action tool call becomes a step `{n, thought, action, observed}`
 * once its result comes back; the thought is the text the actor wrote just
 * before it (spec §8.1 rule 2). Looking is counted, not stepped. The runner
 * owns the limits and the captures; this only keeps the record.
 */
export interface TrackedStep {
  readonly n: number;
  readonly thought: string;
  readonly action: string;
  readonly observed: string;
  readonly isError: boolean;
}

export interface ActorFinal {
  readonly text: string;
  readonly costCents: number;
  readonly tokens: {
    readonly input: number;
    readonly output: number;
    readonly cache_read: number;
    readonly cache_write: number;
  };
}

const Block = z.looseObject({ type: z.string() });
const Message = z.looseObject({ content: z.array(Block).or(z.string()) });
const Event = z.looseObject({ type: z.string(), message: Message.optional() });
const Usage = z.looseObject({
  input_tokens: z.number().default(0),
  output_tokens: z.number().default(0),
  cache_read_input_tokens: z.number().default(0),
  cache_creation_input_tokens: z.number().default(0),
});
const NO_USAGE = {
  input_tokens: 0,
  output_tokens: 0,
  cache_read_input_tokens: 0,
  cache_creation_input_tokens: 0,
};
const Result = z.looseObject({
  type: z.literal('result'),
  result: z.string().default(''),
  total_cost_usd: z.number().default(0),
  usage: Usage.default(NO_USAGE),
});

type Block = z.infer<typeof Block>;

export class StepTracker {
  readonly steps: TrackedStep[] = [];
  looks = 0;
  turns = 0;
  final: ActorFinal | undefined;
  private thought = '';
  private readonly pending = new Map<
    string,
    {
      readonly n: number;
      readonly thought: string;
      readonly tool: string;
      readonly input: Record<string, unknown>;
    }
  >();
  private readonly looking = new Set<string>();

  /** Feeds one event; returns the step it completed, if it completed one. */
  feed(raw: unknown): TrackedStep | undefined {
    const result = Result.safeParse(raw);
    if (result.success) {
      this.final = toFinal(result.data);
      return undefined;
    }
    const event = Event.safeParse(raw);
    if (!event.success || typeof event.data.message?.content === 'string') return undefined;
    const blocks = event.data.message?.content ?? [];
    if (event.data.type === 'assistant') this.turns += 1;
    let done: TrackedStep | undefined;
    for (const b of blocks) done = this.block(b) ?? done;
    return done;
  }

  private block(b: Block): TrackedStep | undefined {
    if (b.type === 'text' && typeof b.text === 'string' && b.text.trim() !== '')
      this.thought = b.text.trim();
    if (b.type === 'tool_use')
      this.use(String(b.id), String(b.name), (b.input ?? {}) as Record<string, unknown>);
    if (b.type === 'tool_result')
      return this.result(String(b.tool_use_id), b.content, b.is_error === true);
    return undefined;
  }

  private use(id: string, name: string, input: Record<string, unknown>): void {
    const action = actionToolName(name);
    if (action !== undefined) {
      const n = this.steps.length + this.pending.size + 1;
      this.pending.set(id, { n, thought: this.thought, tool: action, input });
      this.thought = '';
    } else if (isLookTool(name)) {
      this.looking.add(id);
    }
  }

  private result(id: string, content: unknown, isError: boolean): TrackedStep | undefined {
    if (this.looking.delete(id)) {
      this.looks += 1;
      return undefined;
    }
    const p = this.pending.get(id);
    if (p === undefined) return undefined;
    this.pending.delete(id);
    const step = {
      n: p.n,
      thought: p.thought,
      action: describeAction(p.tool, p.input, asText(content)),
      observed: describeObserved(content),
      isError,
    };
    this.steps.push(step);
    return step;
  }
}

function toFinal(r: z.infer<typeof Result>): ActorFinal {
  return {
    text: r.result,
    costCents: Math.round(r.total_cost_usd * 100),
    tokens: {
      input: r.usage.input_tokens,
      output: r.usage.output_tokens,
      cache_read: r.usage.cache_read_input_tokens,
      cache_write: r.usage.cache_creation_input_tokens,
    },
  };
}

/** The actor's last message: its outcome and the exit interview (spec §8.1). */
export const ActorReport = z.strictObject({
  outcome: z.enum(['completed', 'abandoned', 'blocked']),
  exit_interview: ExitInterview,
});
export type ActorReport = z.infer<typeof ActorReport>;

/** The actor's final JSON, from a fenced block or bare braces; `null` when it is not the contract. */
export function parseActorReport(text: string): ActorReport | null {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text)?.[1];
  const start = text.indexOf('{');
  const bare = start === -1 ? undefined : text.slice(start, text.lastIndexOf('}') + 1);
  for (const candidate of [fenced, bare]) {
    if (candidate === undefined) continue;
    try {
      const parsed = ActorReport.safeParse(JSON.parse(candidate));
      if (parsed.success) return parsed.data;
    } catch {
      // Not JSON; try the next shape.
    }
  }
  return null;
}
