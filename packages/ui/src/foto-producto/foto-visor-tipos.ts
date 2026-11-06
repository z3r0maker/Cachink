/** The camera's live view inside the square guide, and its shutter. */
import type { Ref } from 'react';

export interface FotoVisorHandle {
  /** One shot; the file's URI, or null when there is no camera. */
  tomar(): Promise<string | null>;
}

export interface FotoVisorProps {
  readonly linterna: boolean;
  readonly ref?: Ref<FotoVisorHandle>;
}
