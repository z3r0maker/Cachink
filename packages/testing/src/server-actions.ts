import ts from 'typescript';

/**
 * Reads a Next app's server actions off its source (audit F-03), for the test
 * in each app that holds one rule: **every export of a `'use server'` file is
 * an endpoint anyone can call**, with any arguments, so each one checks the
 * session itself or is on a short public list.
 *
 * The finding this guards against was a read helper exported from an actions
 * file «for the page»: `saldosActuales(businessId)` ran `withTenant` on
 * whatever id the caller sent. Nothing in the type system objects to that, so
 * the rule is held by reading the files.
 *
 * One implementation for the portal and the console (CLAUDE.md §2.3); each
 * names its own guards and its own public list.
 */
export interface ServerAction {
  /** Relative to the scanned root, with `/` separators. */
  readonly file: string;
  /** The export's name, or `inline:<function>` for a function-level directive. */
  readonly name: string;
  /** False when the export is not a function this scan can read (a re-export, a value). */
  readonly readable: boolean;
  /** Every function the body calls by name, through same-file helpers too. */
  readonly calls: readonly string[];
  /** Parameters the action hands to a tenant scope: the caller would pick the tenant. */
  readonly tenantFromCaller: readonly string[];
}

export interface ScanOptions {
  /** Functions that open a tenant's scope from their first argument, e.g. `withTenant`. */
  readonly tenantScopes?: readonly string[];
}

type FunctionNode = ts.FunctionLikeDeclaration;

const DIRECTIVE = 'use server';

function startsWithDirective(statements: ts.NodeArray<ts.Statement> | undefined): boolean {
  const first = statements?.[0];
  return (
    first !== undefined &&
    ts.isExpressionStatement(first) &&
    ts.isStringLiteral(first.expression) &&
    first.expression.text === DIRECTIVE
  );
}

const isExported = (node: ts.Node): boolean =>
  ts.canHaveModifiers(node) &&
  (ts.getModifiers(node) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

function functionOf(node: ts.Node | undefined): FunctionNode | undefined {
  if (node === undefined) return undefined;
  const isFunction =
    ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node);
  return isFunction ? node : undefined;
}

/**
 * What the file declares at its top level, by name: a function, or the value
 * a `const` starts as (a helper, or an object of ports whose members guard).
 */
function topLevel(source: ts.SourceFile): Map<string, ts.Node> {
  const found = new Map<string, ts.Node>();
  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name !== undefined) {
      found.set(statement.name.text, statement);
    }
    if (!ts.isVariableStatement(statement)) continue;
    for (const d of statement.declarationList.declarations) {
      if (d.initializer !== undefined && ts.isIdentifier(d.name)) {
        found.set(d.name.text, d.initializer);
      }
    }
  }
  return found;
}

/**
 * Every function `from` calls by name (`foo()`, not `a.foo()`), following
 * whatever it mentions that the same file declares.
 */
function reach(from: ts.Node, locals: ReadonlyMap<string, ts.Node>): string[] {
  const calls = new Set<string>();
  const seen = new Set<ts.Node>();
  const queue: ts.Node[] = [from];
  const visit = (n: ts.Node): void => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) calls.add(n.expression.text);
    const local = ts.isIdentifier(n) ? locals.get(n.text) : undefined;
    if (local !== undefined) queue.push(local);
    ts.forEachChild(n, visit);
  };
  for (let node = queue.pop(); node !== undefined; node = queue.pop()) {
    if (seen.has(node)) continue;
    seen.add(node);
    visit(node);
  }
  return [...calls].sort();
}

function tenantFromCaller(fn: FunctionNode, scopes: readonly string[]): string[] {
  const params = new Set(
    fn.parameters.map((p) => (ts.isIdentifier(p.name) ? p.name.text : '')).filter(Boolean),
  );
  const taken = new Set<string>();
  const visit = (n: ts.Node): void => {
    const first = ts.isCallExpression(n) ? n.arguments[0] : undefined;
    const scoped =
      ts.isCallExpression(n) && ts.isIdentifier(n.expression) && scopes.includes(n.expression.text);
    if (scoped && first !== undefined && ts.isIdentifier(first) && params.has(first.text)) {
      taken.add(first.text);
    }
    ts.forEachChild(n, visit);
  };
  visit(fn);
  return [...taken].sort();
}

/** The names a file exports as values, each with its function when it has one. */
function exportsOf(
  source: ts.SourceFile,
  locals: ReadonlyMap<string, ts.Node>,
): Map<string, FunctionNode | undefined> {
  const out = new Map<string, FunctionNode | undefined>();
  for (const s of source.statements) {
    if (ts.isExportAssignment(s)) out.set('default', functionOf(s.expression));
    else if (ts.isExportDeclaration(s)) exportList(s, locals, out);
    else if (isExported(s)) exportedDeclaration(s, out);
  }
  return out;
}

/** `export function f` and `export const f = …`; a type or an interface exports no value. */
function exportedDeclaration(s: ts.Statement, out: Map<string, FunctionNode | undefined>): void {
  if (ts.isFunctionDeclaration(s)) out.set(s.name?.text ?? 'default', s);
  if (!ts.isVariableStatement(s)) return;
  for (const d of s.declarationList.declarations) {
    if (ts.isIdentifier(d.name)) out.set(d.name.text, functionOf(d.initializer));
  }
}

/** `export { a, b as c }`, with or without a `from`, and `export * from`. */
function exportList(
  s: ts.ExportDeclaration,
  locals: ReadonlyMap<string, ts.Node>,
  out: Map<string, FunctionNode | undefined>,
): void {
  if (s.isTypeOnly) return;
  if (s.exportClause === undefined || !ts.isNamedExports(s.exportClause)) {
    out.set('*', undefined);
    return;
  }
  // `export { x } from './y'` is somebody else's function: unreadable from here.
  const own = s.moduleSpecifier === undefined;
  for (const e of s.exportClause.elements) {
    if (e.isTypeOnly) continue;
    const local = (e.propertyName ?? e.name).text;
    out.set(e.name.text, own ? functionOf(locals.get(local)) : undefined);
  }
}

/** Functions that carry their own `'use server'`, anywhere in the file. */
function inlineActions(source: ts.SourceFile): Map<string, FunctionNode> {
  const found = new Map<string, FunctionNode>();
  const visit = (n: ts.Node): void => {
    const body = ts.isFunctionLike(n) && 'body' in n ? n.body : undefined;
    if (body !== undefined && ts.isBlock(body) && startsWithDirective(body.statements)) {
      found.set(`inline:${inlineName(n as FunctionNode, source)}`, n as FunctionNode);
    }
    ts.forEachChild(n, visit);
  };
  visit(source);
  return found;
}

/** The function's own name, or the line it starts on when it has none. */
function inlineName(fn: FunctionNode, source: ts.SourceFile): string {
  if (fn.name !== undefined && ts.isIdentifier(fn.name)) return fn.name.text;
  return `line${source.getLineAndCharacterOfPosition(fn.getStart(source)).line + 1}`;
}

/** Every endpoint one source file declares: none, unless it says `'use server'`. */
export function serverActionsIn(
  text: string,
  file: string,
  options: ScanOptions = {},
): ServerAction[] {
  if (!text.includes(DIRECTIVE)) return [];
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const locals = topLevel(source);
  const endpoints = startsWithDirective(source.statements)
    ? exportsOf(source, locals)
    : inlineActions(source);
  return [...endpoints].map(([name, fn]) => ({
    file,
    name,
    readable: fn !== undefined,
    calls: fn === undefined ? [] : reach(fn, locals),
    tenantFromCaller: fn === undefined ? [] : tenantFromCaller(fn, options.tenantScopes ?? []),
  }));
}

/**
 * Every server action in a set of sources, in file order. The caller reads the
 * files (an app's `src`, `.ts` and `.tsx`); this package stays free of Node.
 */
export function scanServerActions(
  sources: ReadonlyMap<string, string>,
  options: ScanOptions = {},
): ServerAction[] {
  return [...sources.keys()]
    .sort()
    .flatMap((file) => serverActionsIn(sources.get(file) ?? '', file, options));
}

/**
 * The actions no guard stands in front of. An action is guarded when it calls
 * one of `guards`, or another action that is: a form's inline wrapper around
 * a guarded action is as closed as the action it calls.
 */
export function unguarded(
  actions: readonly ServerAction[],
  guards: readonly string[],
): ServerAction[] {
  const closed = new Set(guards);
  const open = new Set(actions);
  for (let moved = true; moved; ) {
    moved = false;
    for (const action of open) {
      if (!action.calls.some((name) => closed.has(name))) continue;
      open.delete(action);
      moved = true;
      const sameName = [...open].some((other) => other.name === action.name);
      if (!sameName && !action.name.startsWith('inline:')) closed.add(action.name);
    }
  }
  return [...open];
}
