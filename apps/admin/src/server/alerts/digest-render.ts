/**
 * Plain-text and HTML renderings of the daily digest. Both come from one
 * list of sections, so they cannot say different things. The HTML is plain
 * tables-free markup with inline-free styling: email clients strip most CSS,
 * and the text part is what many staff will read anyway.
 */
import type { SupportItem } from '@xangarro/domain';

import type { DailyDigest } from './digest';
import { rejectionSection } from './rejections';

type DigestData = Omit<DailyDigest, 'text' | 'html'>;

/** Items shown per section before «y N más». */
export const SECTION_CAP = 20;

interface Section {
  readonly title: string;
  readonly empty: string;
  readonly items: readonly SupportItem[];
  /** Plain lines (no link) listed after the items. */
  readonly lines?: readonly string[];
  readonly note?: string;
}

function sections(d: DigestData): Section[] {
  const fresh: Section[] = d.newByKind.map((g) => ({
    title: `Nuevos · ${g.label} (${g.items.length})`,
    empty: '',
    items: g.items,
  }));
  return [
    ...(fresh.length > 0
      ? fresh
      : [{ title: 'Nuevos', empty: 'No llegaron items nuevos ayer.', items: [] }]),
    {
      title: `Urgentes abiertos (${d.counts.urgentesAbiertos})`,
      empty: 'Ningún urgente abierto.',
      items: d.urgentOpen,
    },
    {
      title: `Pagos sin CFDI: ${d.counts.pagosSinCfdi}`,
      empty: '',
      items: [],
      note: `Emítelos en el portal del SAT y registra el UUID: ${d.consoleUrl}/inbox?filtro=pagos_sin_cfdi`,
    },
    { ...rejectionSection(d.rejections), items: [] },
    {
      title: 'Negocios sobre su límite',
      empty: 'Pendiente: esta sección llega con el uso contra límites (N-07).',
      items: [],
    },
  ];
}

function line(i: SupportItem, consoleUrl: string): string {
  return `${i.urgent ? '[URGENTE] ' : ''}${i.title} — ${consoleUrl}/inbox/${i.id}`;
}

function isEmpty(s: Section): boolean {
  return s.items.length === 0 && (s.lines ?? []).length === 0 && s.empty !== '';
}

function more(n: number): string | null {
  return n > SECTION_CAP ? `y ${n - SECTION_CAP} más` : null;
}

export function renderText(d: DigestData): string {
  const out = [d.subject, ''];
  for (const s of sections(d)) {
    out.push(s.title);
    if (isEmpty(s)) out.push(`  ${s.empty}`);
    for (const i of s.items.slice(0, SECTION_CAP)) out.push(`  - ${line(i, d.consoleUrl)}`);
    const rest = more(s.items.length);
    if (rest) out.push(`  ${rest}`);
    for (const l of s.lines ?? []) out.push(`  - ${l}`);
    if (s.note) out.push(`  ${s.note}`);
    out.push('');
  }
  return out.join('\n');
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESCAPES[c] ?? c);
}

function htmlSection(s: Section, consoleUrl: string): string {
  const items = s.items.slice(0, SECTION_CAP).map((i) => {
    const href = escapeHtml(`${consoleUrl}/inbox/${i.id}`);
    const tag = i.urgent ? '<strong>URGENTE</strong> ' : '';
    return `<li>${tag}<a href="${href}">${escapeHtml(i.title)}</a></li>`;
  });
  const rest = more(s.items.length);
  if (rest) items.push(`<li>${rest}</li>`);
  for (const l of s.lines ?? []) items.push(`<li>${escapeHtml(l)}</li>`);
  const body = [
    items.length > 0 ? `<ul>${items.join('')}</ul>` : '',
    isEmpty(s) ? `<p>${escapeHtml(s.empty)}</p>` : '',
    s.note ? `<p>${escapeHtml(s.note)}</p>` : '',
  ].join('');
  return `<h2>${escapeHtml(s.title)}</h2>${body}`;
}

export function renderHtml(d: DigestData): string {
  const body = sections(d)
    .map((s) => htmlSection(s, d.consoleUrl))
    .join('\n');
  return `<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><title>${escapeHtml(
    d.subject,
  )}</title></head><body><h1>${escapeHtml(d.subject)}</h1>\n${body}</body></html>`;
}
