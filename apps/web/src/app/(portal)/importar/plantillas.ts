import type { TemplateId } from '@/server/import/templates';

/** What each import template brings over, and where its blank sheet downloads. */
export interface TemplateMeta {
  readonly id: TemplateId;
  readonly label: string;
  readonly description: string;
  readonly intro: string;
  readonly templateHref: string;
}

export const TEMPLATES: readonly TemplateMeta[] = [
  {
    id: 'productos',
    label: 'Productos',
    description: 'Nombre, precio, categoría. Sin existencias.',
    intro: 'Empiezan en cero existencias; súmalas después en Inventario inicial.',
    templateHref: '/api/import/productos',
  },
  {
    id: 'clientes',
    label: 'Clientes',
    description: 'Nombre, teléfono y RFC opcional. Llegan a tus cajas al sincronizar.',
    intro: 'Si un cliente ya existe (mismo teléfono o nombre), sus datos se actualizan.',
    templateHref: '/api/import/clientes',
  },
];
