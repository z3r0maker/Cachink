import { eachMapping, TraceMap, type SourceMapInput } from '@jridgewell/trace-mapping';

/**
 * One script, one copy per entry (ADR-102, P-35).
 *
 * Next compiles a module once per webpack layer, so a page's server chunk can
 * hold two copies of the same file: the render layer's and the server-action
 * layer's. Only one of them runs. MCR folds both copies into one state for that
 * file and keeps whichever it meets first — often the dead one — so a server
 * action's helpers read 0% while the spec that drove them passes.
 *
 * MCR merges copies correctly when they come from *different* scripts:
 * covered if any copy ran. So a script holding a duplicated file is handed over
 * as one entry per copy, each with the other copies' code marked unexecuted.
 * Code that is not duplicated is identical in every entry, and the union of
 * identical data is itself.
 */

export interface V8Range {
  readonly startOffset: number;
  readonly endOffset: number;
  readonly count: number;
}

export interface V8Function {
  readonly functionName: string;
  readonly isBlockCoverage: boolean;
  readonly ranges: readonly V8Range[];
}

export interface ScriptCoverage {
  readonly url: string;
  readonly source: string;
  readonly sourceMap?: SourceMapInput;
  readonly functions: readonly V8Function[];
}

interface Span {
  readonly start: number;
  readonly end: number;
}

/** Generated characters between two runs of one file's mappings that make them two copies. */
const GAP = 2_000;

function lineStarts(source: string): number[] {
  const starts = [0];
  for (let i = source.indexOf('\n'); i >= 0; i = source.indexOf('\n', i + 1)) starts.push(i + 1);
  return starts;
}

/** Where each counted file's generated code lies in the script: one span per copy. */
export function copiesOf(
  source: string,
  map: SourceMapInput,
  counts: (sourceName: string) => boolean,
): Map<string, Span[]> {
  const starts = lineStarts(source);
  const offsets = new Map<string, number[]>();
  eachMapping(new TraceMap(map), (m) => {
    if (m.source === null || !counts(m.source)) return;
    const at = (starts[m.generatedLine - 1] ?? 0) + m.generatedColumn;
    const list = offsets.get(m.source) ?? [];
    list.push(at);
    offsets.set(m.source, list);
  });
  const spans = new Map<string, Span[]>();
  for (const [name, list] of offsets) {
    list.sort((a, b) => a - b);
    const copies: Span[] = [];
    let start = list[0] ?? 0;
    let last = start;
    for (const at of list.slice(1)) {
      if (at - last > GAP) {
        copies.push({ start, end: last + 1 });
        start = at;
      }
      last = at;
    }
    copies.push({ start, end: last + 1 });
    spans.set(name, copies);
  }
  return spans;
}

const inside = (at: number, spans: readonly Span[]) =>
  spans.some((s) => at >= s.start && at < s.end);

/** The entry that keeps copy `keep` of every duplicated file and zeroes the others. */
function onlyCopy(entry: ScriptCoverage, duplicated: readonly Span[][], keep: number) {
  const zeroed = duplicated.flatMap((copies) => copies.filter((_, i) => i !== keep));
  // The script's own top-level function spans all of it and always stays;
  // any other function that starts inside a zeroed copy goes with it.
  const wholeScript = (fn: V8Function) =>
    fn.ranges[0]?.startOffset === 0 && (fn.ranges[0]?.endOffset ?? 0) >= entry.source.length;
  const functions = entry.functions.filter(
    (fn) => wholeScript(fn) || !inside(fn.ranges[0]?.startOffset ?? 0, zeroed),
  );
  const unrun = zeroed.map((s) => ({
    functionName: '',
    isBlockCoverage: true,
    ranges: [{ startOffset: s.start, endOffset: s.end, count: 0 }],
  }));
  return { ...entry, url: `${entry.url}?copy=${keep + 1}`, functions: [...functions, ...unrun] };
}

export function splitDuplicatedCopies(
  entry: ScriptCoverage,
  counts: (sourceName: string) => boolean,
): ScriptCoverage[] {
  if (entry.sourceMap === undefined) return [entry];
  const duplicated = [...copiesOf(entry.source, entry.sourceMap, counts).values()].filter(
    (copies) => copies.length > 1,
  );
  if (duplicated.length === 0) return [entry];
  const most = Math.max(...duplicated.map((c) => c.length));
  return Array.from({ length: most }, (_, keep) => onlyCopy(entry, duplicated, keep));
}
