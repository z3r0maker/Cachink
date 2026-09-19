/** «Hola, Pedro» — or just «Hola» when the account carries no name (ADR-086). */
export const saludo = (nombre: string | null): string =>
  nombre === null || nombre === '' ? 'Hola' : `Hola, ${nombre}`;
