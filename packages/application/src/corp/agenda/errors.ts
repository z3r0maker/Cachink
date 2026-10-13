/** Typed errors of the Agenda's use cases (E-04, CLAUDE.md §8). */

export class InscripcionFuturaError extends Error {
  readonly code = 'INSCRIPCION_FUTURA' as const;
  constructor(readonly fecha: string) {
    super('La inscripción al RFC no puede ser una fecha futura.');
    this.name = 'InscripcionFuturaError';
  }
}
