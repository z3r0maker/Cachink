/** Typed errors for creating and editing clientes (N-16). */

export class ClientInvalidError extends Error {
  readonly code = 'CLIENT_INVALID' as const;

  constructor(readonly fields: readonly string[]) {
    super(`Revisa estos datos del cliente: ${fields.join(', ')}.`);
    this.name = 'ClientInvalidError';
  }
}

export class ClientNotFoundError extends Error {
  readonly code = 'CLIENT_NOT_FOUND' as const;

  constructor(readonly id: string) {
    super('Ese cliente ya no existe.');
    this.name = 'ClientNotFoundError';
  }
}
