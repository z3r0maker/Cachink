/**
 * The smallest XML reader a CFDI needs (E-11). A CFDI keeps its data in
 * attributes, so this reads elements and attributes and skips text,
 * comments and processing instructions.
 *
 * It refuses any DOCTYPE, which means no entity can be declared or expanded
 * (no XXE, no «billion laughs»). Only the five predefined entities and
 * numeric references are decoded. A CFDI never needs more.
 */
export class XmlInvalidoError extends Error {
  readonly code = 'XML_INVALIDO' as const;
  constructor(detalle: string) {
    super(`El archivo no es un XML válido: ${detalle}.`);
    this.name = 'XmlInvalidoError';
  }
}

export interface Nodo {
  /** The local name, without its namespace prefix (`Comprobante`, not `cfdi:Comprobante`). */
  readonly nombre: string;
  /** Attributes by local name; namespace declarations are left out. */
  readonly attrs: ReadonlyMap<string, string>;
  readonly hijos: readonly Nodo[];
}

interface Abierto {
  readonly tag: string;
  readonly nodo: { nombre: string; attrs: Map<string, string>; hijos: Nodo[] };
}

const SKIP = /<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>/y;
const TAG = /<(\/?)([A-Za-z_][\w.:-]*)((?:\s+[^\s=/>]+\s*=\s*(?:"[^"<]*"|'[^'<]*'))*)\s*(\/?)>/y;
const ATTR = /([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const ENTIDADES: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };

const local = (name: string): string => name.slice(name.indexOf(':') + 1);

function decodificar(value: string): string {
  return value.replace(/&(#x[0-9a-fA-F]+|#\d+|\w+);|&/g, (match, ref: string | undefined) => {
    if (ref === undefined) throw new XmlInvalidoError('hay un «&» suelto');
    if (ref.startsWith('#x')) return String.fromCodePoint(parseInt(ref.slice(2), 16));
    if (ref.startsWith('#')) return String.fromCodePoint(parseInt(ref.slice(1), 10));
    const plain = ENTIDADES[ref];
    if (plain === undefined) throw new XmlInvalidoError(`la entidad ${match} no existe`);
    return plain;
  });
}

function atributos(raw: string): Map<string, string> {
  const attrs = new Map<string, string>();
  for (const m of raw.matchAll(ATTR)) {
    const name = m[1]!;
    if (name === 'xmlns' || name.startsWith('xmlns:')) continue;
    attrs.set(local(name), decodificar(m[2] ?? m[3] ?? ''));
  }
  return attrs;
}

function saltar(xml: string, at: number): number | null {
  SKIP.lastIndex = at;
  return SKIP.exec(xml) === null ? null : SKIP.lastIndex;
}

/** Applies one tag to the open stack; returns the root when it closes. */
function aplicar(m: RegExpExecArray, pila: Abierto[]): Nodo | null {
  const [, cierre, tag = '', raw = '', vacio] = m;
  if (cierre === '/') {
    const abierto = pila.pop();
    if (abierto?.tag !== tag) throw new XmlInvalidoError(`</${tag}> no cierra lo que se abrió`);
    return pila.length === 0 ? abierto.nodo : null;
  }
  const nodo = { nombre: local(tag), attrs: atributos(raw), hijos: [] as Nodo[] };
  pila.at(-1)?.nodo.hijos.push(nodo);
  if (vacio !== '/') pila.push({ tag, nodo });
  return vacio === '/' && pila.length === 0 ? nodo : null;
}

/** The document's root element. */
export function leerXml(input: string): Nodo {
  const xml = input.replace(/^﻿/, '');
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new XmlInvalidoError('no se aceptan DOCTYPE');
  const pila: Abierto[] = [];
  let raiz: Nodo | null = null;
  let at = xml.indexOf('<');
  if (at === -1 || xml.slice(0, at).trim() !== '') throw new XmlInvalidoError('no empieza con <');
  while (at !== -1) {
    const salto = saltar(xml, at);
    if (salto !== null) {
      at = xml.indexOf('<', salto);
      continue;
    }
    if (raiz !== null) throw new XmlInvalidoError('hay contenido después del elemento raíz');
    TAG.lastIndex = at;
    const m = TAG.exec(xml);
    if (m === null) throw new XmlInvalidoError(`etiqueta ilegible en la posición ${at}`);
    raiz = aplicar(m, pila);
    at = xml.indexOf('<', TAG.lastIndex);
  }
  if (raiz === null || pila.length > 0) throw new XmlInvalidoError('hay etiquetas sin cerrar');
  return raiz;
}

/** The first child named `nombre`. */
export const hijo = (nodo: Nodo | undefined, nombre: string): Nodo | undefined =>
  nodo?.hijos.find((h) => h.nombre === nombre);

/** Every child named `nombre`. */
export const hijos = (nodo: Nodo | undefined, nombre: string): readonly Nodo[] =>
  nodo?.hijos.filter((h) => h.nombre === nombre) ?? [];
