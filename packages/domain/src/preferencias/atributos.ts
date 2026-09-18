import { AttrDefSchema, type AttrDef } from '../entities/business.js';

/**
 * Atributos de producto (P-08): the extra fields a catalogue row can carry
 * (talla, color, duración). The owner types a name and, optionally, the
 * choices; the key and the kind are derived — one decision fewer.
 */
export interface AtributoDraft {
  readonly label: string;
  /** Empty means free text; otherwise a list of these choices. */
  readonly opciones: readonly string[];
  readonly obligatorio: boolean;
}

export type AtributosResult =
  | { readonly ok: true; readonly value: AttrDef[] }
  | { readonly ok: false; readonly errors: Readonly<Record<number, string>> };

/** `Tamaño de porción` → `tamano_de_porcion`: ASCII, lower snake case, never a leading digit. */
export function atributoClave(label: string): string {
  const slug = label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return (/^[0-9]/.test(slug) ? `_${slug}` : slug).slice(0, 40);
}

function toDef(d: AtributoDraft): AttrDef {
  const label = d.label.trim();
  const opciones = d.opciones.map((o) => o.trim()).filter((o) => o.length > 0);
  const base = { clave: atributoClave(label), label, obligatorio: d.obligatorio };
  return opciones.length > 0 ? { ...base, tipo: 'select', opciones } : { ...base, tipo: 'texto' };
}

function problemOf(d: AtributoDraft, clave: string, seen: Set<string>): string | null {
  const label = d.label.trim();
  if (label.length === 0 || clave.length === 0) return 'Escribe el nombre del atributo.';
  if (label.length > 60) return 'Usa un nombre de 60 caracteres o menos.';
  if (seen.has(clave)) return 'Ya tienes un atributo con ese nombre.';
  return null;
}

export function validateAtributos(drafts: readonly AtributoDraft[]): AtributosResult {
  const errors: Record<number, string> = {};
  const seen = new Set<string>();
  const value = drafts.map((d, i) => {
    const def = toDef(d);
    const problem = problemOf(d, def.clave, seen);
    if (problem !== null) errors[i] = problem;
    seen.add(def.clave);
    return def;
  });
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, value };
}

/** The stored JSON as definitions, skipping any entry that does not parse. */
export function parseAtributos(json: string | null | undefined): AttrDef[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json ?? '[]');
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((x) => {
    const r = AttrDefSchema.safeParse(x);
    return r.success ? [r.data] : [];
  });
}
