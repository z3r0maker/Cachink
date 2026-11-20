import { StackError } from './errors';

/**
 * A run or a seed touches only the hosts `config.yaml` allows, themselves a
 * subset of `LOCAL_HOSTS` (track S §3). The host is compared whole: a name that
 * starts with «localhost» is not localhost.
 */
export function assertLocalUrl(url: string, allowed: readonly string[]): void {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    throw new StackError('HOST_NOT_ALLOWED', `«${url}» is not a URL`);
  }
  if (!allowed.includes(host)) {
    throw new StackError(
      'HOST_NOT_ALLOWED',
      `${host} is not in allowed_hosts (${allowed.join(', ')})`,
    );
  }
}
