/*
 * Barrel for the Icon primitive.
 *
 * `Icon` comes from `./icon`, which every bundler resolves to the right
 * implementation: Metro picks `icon.native.tsx`, react-native-web-aware
 * resolvers pick `icon.web.tsx`, and plain Vite/Vitest fall through to the
 * `icon.tsx` barrel that re-exports the web variant.
 *
 * The type contract and the constants come from `./icon.shared` **directly**,
 * never through `./icon`. A resolver that understands platform extensions
 * ranks `icon.web.tsx` above `icon.tsx` for the specifier `./icon`, and the
 * web variant exports only `Icon` — so routing the constants through here
 * resolved them to a module that does not have them, failing at import time
 * with "does not provide an export named 'ICON_DEFAULT_SIZE'". That is
 * invisible under plain Vite (which picks `icon.tsx`) and broke every
 * Storybook story. `icon.tsx`'s own docblock already prescribes this rule;
 * this file now follows it. Audit 2026-09.
 */
export { Icon } from './icon';
export type { IconName, IconProps } from './icon.shared';
export { ICON_DEFAULT_SIZE, ICON_DEFAULT_STROKE } from './icon.shared';
