/**
 * lockfile-consistency.ts — is `pnpm-lock.yaml` one resolution, or two halves?
 *
 * pnpm keeps one snapshot of a package version per set of peers it was
 * installed with. Those copies differ in their peers and in nothing else: a
 * plain dependency is resolved once per package version. A lockfile where two
 * copies of `@expo/cli@55.0.30` name different versions of `ws` was not
 * produced by one `pnpm install`; it was merged, or re-resolved in part.
 *
 * `--frozen-lockfile` accepts such a file, so nothing fails until someone adds
 * a package and pnpm quietly settles the disagreement inside their change.
 * `lockfile-consistency.test.ts` runs this over the committed file.
 *
 * The lockfile is machine-written and regular, so it is read by its
 * indentation; the repo carries no YAML parser at the root and needs none here.
 */

/** A package version whose copies resolve one plain dependency differently. */
export interface Disagreement {
  /** The package version, without its peers: `@expo/cli@55.0.30`. */
  readonly pkg: string;
  readonly dependency: string;
  /** Every version its copies name, in the order the lockfile lists them. */
  readonly versions: readonly string[];
}

/** An entry's key at two spaces: `name@version`, then its peers in brackets, if any. */
const KEY = /^ {2}'?((?:@[^@/']+\/)?[^@/']+@[^('":]+)(?:\(.*)?'?:(?: \{\})?$/;
/** A dependency at six spaces: its name, and its version up to its own peers. */
const DEP = /^ {6}'?((?:@[^@/':]+\/)?[^@/':]+)'?: ([^( ]+)/;

type Visit = (owner: string, field: string, line: string) => void;

/**
 * Walks a section: entries at two spaces, their fields at four, the fields'
 * lines at six. An entry whose key does not read as `name@version` (a tarball
 * URL, say) is skipped whole, never charged to the entry before it.
 */
function eachLine(lines: readonly string[], visit: Visit): number {
  let owner: string | null = null;
  let field = '';
  let entries = 0;
  for (const line of lines) {
    if (/^ {2}\S/.test(line)) {
      owner = KEY.exec(line)?.[1] ?? null;
      field = '';
      if (owner !== null) entries += 1;
    } else if (/^ {4}\S/.test(line)) {
      field = line.trim();
    } else if (owner !== null && /^ {6}\S/.test(line)) {
      visit(owner, field, line);
    }
  }
  return entries;
}

/** The names each package version declares as peers: the ones allowed to differ. */
function declaredPeers(packages: readonly string[]): Map<string, Set<string>> {
  const peers = new Map<string, Set<string>>();
  eachLine(packages, (owner, field, line) => {
    if (field !== 'peerDependencies:') return;
    const name = DEP.exec(line)?.[1];
    if (name === undefined) return;
    peers.set(owner, (peers.get(owner) ?? new Set()).add(name));
  });
  return peers;
}

/** For each package version, every version its copies name for each plain dependency. */
function resolved(
  snapshots: readonly string[],
  peers: ReadonlyMap<string, ReadonlySet<string>>,
): Map<string, Map<string, Set<string>>> {
  const seen = new Map<string, Map<string, Set<string>>>();
  const entries = eachLine(snapshots, (owner, field, line) => {
    if (field !== 'dependencies:' && field !== 'optionalDependencies:') return;
    const [, name, version] = DEP.exec(line) ?? [];
    if (name === undefined || version === undefined || peers.get(owner)?.has(name)) return;
    const deps = seen.get(owner) ?? new Map<string, Set<string>>();
    seen.set(owner, deps.set(name, (deps.get(name) ?? new Set()).add(version)));
  });
  if (entries === 0) throw new Error('lockfile-consistency: no snapshot could be read');
  return seen;
}

/** The lines of a top-level section, up to the next one. */
function section(lines: readonly string[], name: string): readonly string[] {
  const start = lines.indexOf(`${name}:`);
  if (start === -1) throw new Error(`lockfile-consistency: the lockfile has no ${name} section`);
  const length = lines.slice(start + 1).findIndex((line) => /^\S/.test(line));
  return lines.slice(start + 1, length === -1 ? undefined : start + 1 + length);
}

/**
 * Every package version whose copies disagree about a dependency that is not
 * one of its peers. Empty for a lockfile that one `pnpm install` produced.
 * Throws on a file it cannot read, so a new format fails instead of passing.
 */
export function disagreements(lockfile: string): readonly Disagreement[] {
  const lines = lockfile.split('\n');
  const seen = resolved(section(lines, 'snapshots'), declaredPeers(section(lines, 'packages')));
  return [...seen].flatMap(([pkg, deps]) =>
    [...deps]
      .filter(([, versions]) => versions.size > 1)
      .map(([dependency, versions]) => ({ pkg, dependency, versions: [...versions] })),
  );
}
