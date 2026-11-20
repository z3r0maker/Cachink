import { isAbsolute, relative, resolve } from 'node:path';

import { JUDGE_TOOLS } from './args';

/**
 * The judge's session, checked after it ends (S-08). Its flags already keep it
 * to reading its run folder; this proves it from the transcript, the way S-07
 * proves the actor's isolation: the `init` event shows exactly the three
 * reading tools and no MCP server, and every path it read is inside the run.
 */
interface Init {
  type?: string;
  subtype?: string;
  tools?: unknown;
  mcp_servers?: unknown;
}
interface ToolUse {
  type?: string;
  name?: string;
  input?: Record<string, unknown>;
}

function initProblems(events: readonly unknown[]): string[] {
  const init = events.find(
    (e) => (e as Init).type === 'system' && (e as Init).subtype === 'init',
  ) as Init | undefined;
  if (init === undefined) return ['no init event: what the judge could use is unknown'];
  const visible = (Array.isArray(init.tools) ? init.tools.map(String) : []).sort();
  const expected = [...JUDGE_TOOLS].sort();
  const problems: string[] = [];
  if (visible.join() !== expected.join()) {
    problems.push(
      `the judge saw ${visible.join(', ') || 'no tools'}, not only ${expected.join(', ')}`,
    );
  }
  if (Array.isArray(init.mcp_servers) && init.mcp_servers.length > 0) {
    problems.push(`the judge had an MCP server: ${JSON.stringify(init.mcp_servers)}`);
  }
  return problems;
}

function toolUses(events: readonly unknown[]): ToolUse[] {
  return events.flatMap((e) => {
    const content = (e as { type?: string; message?: { content?: unknown } }).message?.content;
    if ((e as { type?: string }).type !== 'assistant' || !Array.isArray(content)) return [];
    return (content as ToolUse[]).filter((b) => b.type === 'tool_use');
  });
}

/** A path a call names, resolved against the run folder, unless it stays inside it. */
function outside(path: unknown, runDir: string): string | undefined {
  if (typeof path !== 'string' || path === '') return undefined;
  const rel = relative(runDir, resolve(runDir, path));
  return rel.startsWith('..') || isAbsolute(rel) ? path : undefined;
}

export function judgeSessionProblems(events: readonly unknown[], runDir: string): string[] {
  const reads = toolUses(events).flatMap((u) => {
    const path = outside(u.input?.file_path, runDir) ?? outside(u.input?.path, runDir);
    return path === undefined ? [] : [`${u.name ?? 'a tool'} reached outside the run: ${path}`];
  });
  return [...initProblems(events), ...reads];
}

/** The JSON object the rubric asks for, out of the judge's last message. */
export function parseJudgeAnswer(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end < start) throw new Error('the judge answered with no JSON object');
  try {
    return JSON.parse(text.slice(start, end + 1)) as unknown;
  } catch (e) {
    throw new Error(
      `the judge's answer is not JSON: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}
