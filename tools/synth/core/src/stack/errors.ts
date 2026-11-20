/** Why a corrida's stack refused to start, or could not. */
export type StackErrorCode =
  | 'STACK_ID_INVALID'
  | 'DOCKER_DISK_LOW'
  | 'DOCKER_DF_UNREADABLE'
  | 'HOST_NOT_ALLOWED'
  | 'SEED_UNKNOWN';

export class StackError extends Error {
  readonly code: StackErrorCode;
  constructor(code: StackErrorCode, message: string) {
    super(message);
    this.name = 'StackError';
    this.code = code;
  }
}
