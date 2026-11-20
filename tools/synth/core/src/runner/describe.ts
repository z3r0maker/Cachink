/**
 * Steps in words, for the run record and the judge: what the actor did, named
 * by what the person would call the element, and what the screen said back.
 *
 * The actor may name the element (`element`) or give only a snapshot ref
 * (`target`, like `e44`), which means nothing outside that one snapshot.
 * Playwright MCP answers with the code it ran, whose locator names the element
 * properly (`getByRole('button', { name: 'Abrir turno' })`), so that is used
 * when the actor gave no name.
 */
const q = (v: unknown): string => `«${String(v ?? '')}»`;

/** The element a Playwright line acted on, in words, or `undefined`. */
export function locatorName(code: string): string | undefined {
  const line = code.split('\n').find((l) => /\bpage\./.test(l)) ?? '';
  const byRole = /getByRole\('[^']*',\s*\{\s*name:\s*'((?:[^'\\]|\\.)*)'/.exec(line);
  if (byRole?.[1] !== undefined) return byRole[1];
  const byOther = /getBy(?:Text|Label|Placeholder|TestId|AltText|Title)\('((?:[^'\\]|\\.)*)'/.exec(
    line,
  );
  return byOther?.[1];
}

type Input = Readonly<Record<string, unknown>>;

const named = (i: Input, code: string, key = 'element', ref = 'target'): string =>
  q((i[key] as string | undefined) || locatorName(code) || i[ref]);

const DESCRIBE: Readonly<Record<string, (i: Input, code: string) => string>> = {
  click: (i, c) => `click ${named(i, c)}`,
  type: (i, c) => `type ${q(i.text)} into ${named(i, c)}`,
  press_key: (i) => `press ${q(i.key)}`,
  select_option: (i, c) =>
    `choose ${q((i.values as unknown[] | undefined)?.join(', '))} in ${named(i, c)}`,
  fill_form: (i) =>
    `fill ${((i.fields as { name?: unknown; value?: unknown }[] | undefined) ?? [])
      .map((f) => `${q(f.name)} = ${q(f.value)}`)
      .join(', ')}`,
  hover: (i, c) => `hover ${named(i, c)}`,
  drag: (i) => `drag ${q(i.startElement || i.startTarget)} to ${q(i.endElement || i.endTarget)}`,
  handle_dialog: (i) => (i.accept === false ? 'dismiss the dialog' : 'accept the dialog'),
  navigate_back: () => 'go back',
};

/** `resultText` is the tool's answer, where Playwright MCP shows the code it ran. */
export function describeAction(tool: string, input: Input, resultText = ''): string {
  return (DESCRIBE[tool] ?? ((): string => tool))(input, resultText);
}

/** Tool result content as plain text, whether a string or a list of text blocks. */
export function asText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((b: { type?: string; text?: unknown }) => (b.type === 'text' ? String(b.text ?? '') : ''))
    .join('\n');
}

/**
 * What came back, short: Playwright MCP answers with the code it ran, the page
 * and a full snapshot. The page lines (URL, title) and any error say what
 * happened; the snapshot is in the trace and the screenshot.
 */
export function describeObserved(content: unknown): string {
  const body = asText(content);
  const pageLines = body
    .split('\n')
    .filter((l) => /^- Page (URL|Title):/.test(l))
    .map((l) => l.replace(/^- /, ''));
  if (pageLines.length > 0 && !/^### Error/m.test(body)) return pageLines.join(' · ');
  return body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^#+ /gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 400);
}
