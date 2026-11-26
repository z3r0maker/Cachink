/**
 * The four fields a cover asks for.
 *
 * Each is a bracketed placeholder on the page and, in the finished file, a Word
 * content control around it (`finish.ts`): one click selects the placeholder,
 * typing replaces it and keeps its style. The key is the control's tag, the
 * alias is the label Word shows on it.
 */

export const FIELDS = {
  titulo: { alias: 'Título', placeholder: '[Título del documento]', kind: 'text' },
  subtitulo: {
    alias: 'Subtítulo',
    placeholder: '[Subtítulo o descripción breve del documento]',
    kind: 'text',
  },
  fecha: { alias: 'Fecha', placeholder: '[DD de mes de AAAA]', kind: 'date' },
  autor: { alias: 'Autor', placeholder: '[Nombre del autor]', kind: 'text' },
} as const;

export type FieldTag = keyof typeof FIELDS;

/** What a cover says. */
export interface Copy extends Readonly<Record<FieldTag, string>> {
  readonly lema: string;
  readonly fechaLabel: string;
  readonly autorLabel: string;
}

/** The template's copy: the tagline, the labels, and each field's placeholder. */
export const COPY: Copy = {
  lema: 'Finanzas para emprendedores.',
  titulo: FIELDS.titulo.placeholder,
  subtitulo: FIELDS.subtitulo.placeholder,
  fechaLabel: 'Fecha',
  fecha: FIELDS.fecha.placeholder,
  autorLabel: 'Autor',
  autor: FIELDS.autor.placeholder,
};

/**
 * Long copy for a layout check only: a three-line title, a two-line subtitle and
 * a long name. With it the fields are plain text, so the file is not a template.
 */
export const SAMPLE: Copy = {
  ...COPY,
  titulo: 'Plan de negocio y proyecciones financieras para el cierre de 2027',
  subtitulo:
    'Resumen ejecutivo para socios e inversionistas, con los estados financieros del tercer trimestre',
  fecha: '26 de noviembre de 2026',
  autor: 'Eduardo Torres Gaxiola',
};
