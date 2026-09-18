/**
 * extract.ts — pull user-visible strings out of a TS/TSX source file.
 *
 * Uses the TypeScript compiler API, not a regex, so comments, type-level
 * literals, module specifiers and i18n keys (`t('planLimit.title')`) are never
 * mistaken for copy. What counts as copy: JSX text, string and template
 * literals in value position, and JSX attribute values other than the
 * structural ones in `STRUCTURAL_ATTRS`.
 */

import ts from 'typescript';

/** One string a user could see (or a link the app could open). */
export interface ExtractedString {
  readonly text: string;
  readonly line: number;
  /** Dotted object-literal path when the string is a property value (i18n key). */
  readonly key: string | null;
  /** True for lowercase identifier-like tokens (`'plan_limit'`): enum values, not copy. */
  readonly codeToken: boolean;
}

/** JSX attributes whose values configure a component and are never read by a user. */
const STRUCTURAL_ATTRS = new Set([
  'testID',
  'key',
  'id',
  'nativeID',
  'name',
  'icon',
  'variant',
  'size',
  'tone',
  'color',
  'type',
  'as',
  'role',
  'accessibilityRole',
  'keyboardType',
  'autoCapitalize',
  'autoComplete',
  'textContentType',
  'returnKeyType',
  'fontFamily',
  'fontWeight',
  'theme',
  'pointerEvents',
  'resizeMode',
  'mode',
  'kind',
  'status',
  'intent',
]);

/** Call targets whose string arguments are keys, specifiers or log text. */
const NON_COPY_CALLEES = new Set([
  't',
  'require',
  'console.log',
  'console.warn',
  'console.error',
  'console.info',
  'console.debug',
  'logger.info',
  'logger.warn',
  'logger.error',
  'logger.debug',
]);

/** Lowercase tokens (`'plan_limit'`, `'https://…'`) and dotted i18n keys (`'activate.codeLabel'`). */
const CODE_TOKEN = /^[a-z0-9_.:/@#-]*$|^[A-Za-z0-9_]+(\.[A-Za-z0-9_]+)+$/;

function calleeName(call: ts.CallExpression): string {
  const e = call.expression;
  if (ts.isIdentifier(e)) return e.text;
  if (!ts.isPropertyAccessExpression(e)) return '';
  // `props.t('key')`, `i18n.t('key')`: any `.t(...)` is a translation lookup.
  if (e.name.text === 't') return 't';
  return ts.isIdentifier(e.expression) ? `${e.expression.text}.${e.name.text}` : '';
}

type Position = (node: ts.Node, parent: ts.Node) => boolean;

/** Module specifiers and type-level literals. */
const moduleOrType: Position = (_n, p) =>
  ts.isImportDeclaration(p) ||
  ts.isExportDeclaration(p) ||
  ts.isLiteralTypeNode(p) ||
  ts.isImportTypeNode(p) ||
  ts.isExternalModuleReference(p) ||
  (ts.isCallExpression(p) && p.expression.kind === ts.SyntaxKind.ImportKeyword);

/** `{ 'key': v }` and `obj['key']`. */
const keyPosition: Position = (n, p) =>
  (ts.isPropertyAssignment(p) && p.name === n) ||
  (ts.isElementAccessExpression(p) && p.argumentExpression === n);

/** First argument of `t()`, `require()`, `console.*`, `logger.*`. */
const nonCopyCall: Position = (n, p) =>
  ts.isCallExpression(p) && p.arguments[0] === n && NON_COPY_CALLEES.has(calleeName(p));

/** `testID="…"` or `icon={'…'}`. */
const structuralAttr: Position = (_n, p) => {
  const attr = ts.isJsxExpression(p) ? p.parent : p;
  return ts.isJsxAttribute(attr) && STRUCTURAL_ATTRS.has(attr.name.getText());
};

const NON_COPY_POSITIONS: readonly Position[] = [
  moduleOrType,
  keyPosition,
  nonCopyCall,
  structuralAttr,
];

/** True when a literal sits somewhere that is never shown to a user. */
function isNonCopyPosition(node: ts.Node): boolean {
  return NON_COPY_POSITIONS.some((test) => test(node, node.parent));
}

/** Dotted path of enclosing `key: value` pairs, e.g. `planLimit.body`. */
function keyPath(node: ts.Node): string | null {
  const parts: string[] = [];
  let cur: ts.Node | undefined = node;
  while (cur && !ts.isSourceFile(cur)) {
    if (ts.isPropertyAssignment(cur)) parts.unshift(cur.name.getText().replace(/['"]/g, ''));
    cur = cur.parent;
  }
  return parts.length > 0 ? parts.join('.') : null;
}

/** Template text with `${…}` holes rendered as `{…}` so rules still see the prose. */
function templateText(node: ts.TemplateExpression): string {
  return node.head.text + node.templateSpans.map((s) => `{…}${s.literal.text}`).join('');
}

function literalText(node: ts.Node): string | null {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) return templateText(node);
  if (ts.isJsxText(node)) return node.text.trim() || null;
  return null;
}

/** Every user-visible string in `source`, in document order. */
export function extractStrings(fileName: string, source: string): readonly ExtractedString[] {
  const kind = fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, kind);
  const out: ExtractedString[] = [];
  const visit = (node: ts.Node): void => {
    const text = literalText(node);
    if (text !== null && text.trim() !== '' && !isNonCopyPosition(node)) {
      const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
      out.push({ text, line: line + 1, key: keyPath(node), codeToken: CODE_TOKEN.test(text) });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}
