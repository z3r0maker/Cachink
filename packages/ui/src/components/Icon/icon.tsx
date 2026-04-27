/**
 * Icon — the Cachink line-icon primitive (ADR-040).
 *
 * Wraps `lucide-react` (web/Tauri) and `lucide-react-native` (mobile) behind
 * a single curated `IconName` union so consumers can't import arbitrary
 * icons. The union acts as the brand's icon contract — every screen + tab
 * + button reaches into this same set so the visual language stays
 * consistent.
 *
 * Pattern matches `Modal/modal.tsx` (CLAUDE.md §5.3 platform-extension
 * pattern): the type contract lives in `./icon.shared.ts` so the platform
 * variants can import it without re-resolving back through this entry
 * file (Metro would otherwise pick `icon.native.tsx` for `./icon` and
 * cycle). Rendering lives in `./icon.web.tsx` (Vite/Tauri/Storybook/
 * Vitest) and `./icon.native.tsx` (Metro/RN). The default re-export
 * delegates to the web variant so Vite-based tools resolve correctly
 * without extra config.
 *
 * Stroke + size defaults align with the §8 brand: 2 px stroke (matches
 * the 2 px border tokens), 24 px default size (matches the 22-px tag
 * height). Color defaults to `currentColor` so the icon inherits text
 * color in any context.
 */
import type { ReactElement } from 'react';

export type { IconName, IconProps } from './icon.shared';
export { ICON_DEFAULT_SIZE, ICON_DEFAULT_STROKE } from './icon.shared';

// Default export for Vite/Tauri/Vitest. Metro picks `./icon.native.tsx`.
export type { IconElement } from './icon.web';
export { Icon } from './icon.web';

/** Re-export for tests / consumers that want to introspect availability. */
export type AnyIconElement = ReactElement;
