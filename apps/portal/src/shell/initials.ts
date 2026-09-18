/** "Ana Robledo" → "AR"; a single word gives one letter. Server and client both use it. */
export const initials = (name: string): string =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
