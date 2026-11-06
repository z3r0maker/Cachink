/**
 * docs/store/soporte.md, read into the parts of the support page (ElSoporte).
 * The Markdown stays the one text: the page lays it out, and a section it
 * expects but cannot find fails the build instead of rendering a gap.
 */
import { parseLegalMarkdown } from '../legal/markdown.js';

export const SOPORTE_EMAIL = 'soporte@xangarro.mx';

const LEAD = /^\*\*([^*]+?)\.?\*\*\s*(.*)$/;
const TRAILING_LINK = /\s*\[([^\]]+)\]\(([^)\s]+)\)$/;
const LINK = /^\[([^\]]+)\]\(([^)\s]+)\)$/;

function missing(what) {
  return new Error(`docs/store/soporte.md: no encuentro «${what}»`);
}

/** Blocks grouped under each heading of `level`; blocks before the first are `head`. */
function byHeading(blocks, level) {
  const head = [];
  const sections = [];
  for (const b of blocks) {
    if (b.type === 'heading' && b.level === level) sections.push({ title: b.text, blocks: [] });
    else if (sections.length > 0) sections[sections.length - 1].blocks.push(b);
    else head.push(b);
  }
  return { head, sections };
}

function section(sections, title) {
  const found = sections.find((s) => s.title === title);
  if (!found) throw missing(title);
  return found;
}

function first(blocks, type, where) {
  const found = blocks.find((b) => b.type === type);
  if (!found) throw missing(`${where}: ${type}`);
  return found;
}

/** «**Título.** Texto [Botón](href)»: a card with an optional button. */
function card(item) {
  const lead = LEAD.exec(item);
  if (!lead) throw missing(`un renglón que empiece en negritas: ${item}`);
  const [, titulo, resto] = lead;
  const link = TRAILING_LINK.exec(resto);
  if (!link) return { titulo, texto: resto, boton: null };
  return {
    titulo,
    texto: resto.slice(0, link.index),
    boton: { label: link[1], href: link[2] },
  };
}

function cards(sections, title) {
  return first(section(sections, title).blocks, 'ul', title).items.map(card);
}

function paragraphs(blocks) {
  return blocks.filter((b) => b.type === 'p').map((b) => b.text);
}

/** «Eliminar tu cuenta»: the steps, what is erased, what is kept, the emails. */
function eliminar(sections) {
  const title = 'Eliminar tu cuenta';
  const { head, sections: subs } = byHeading(section(sections, title).blocks, 3);
  const lista = (t) => ({ titulo: t, items: first(section(subs, t).blocks, 'ul', t).items });
  const texto = (t) => ({ titulo: t, parrafos: paragraphs(section(subs, t).blocks) });
  return {
    titulo: title,
    intro: paragraphs(head),
    pasos: first(head, 'ol', title).items,
    borra: lista('Se borra a los 30 días'),
    guarda: { ...lista('Se guarda 10 años, bloqueado'), ...texto('Se guarda 10 años, bloqueado') },
    correo: texto('Te avisamos por correo'),
    sinPortal: texto('Si no puedes entrar al portal'),
  };
}

function legal(sections) {
  const title = 'Privacidad y términos';
  return first(section(sections, title).blocks, 'ul', title).items.map((item) => {
    const link = LINK.exec(item);
    if (!link) throw missing(`${title}: ${item}`);
    return { label: link[1], href: link[2] };
  });
}

export function soporteDesde(source) {
  if (!source.includes(SOPORTE_EMAIL)) throw missing(SOPORTE_EMAIL);
  const { head, sections: top } = byHeading(parseLegalMarkdown(source), 1);
  const { head: intro, sections } = byHeading(top[0]?.blocks ?? head, 2);
  return {
    intro: paragraphs(intro),
    escribe: paragraphs(section(sections, 'Escríbenos').blocks),
    app: cards(sections, 'Si cobras con la app'),
    duenio: cards(sections, 'Si eres el dueño del negocio'),
    eliminar: eliminar(sections),
    legal: legal(sections),
  };
}
