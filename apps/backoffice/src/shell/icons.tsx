import type { NavHref } from './nav-items';

/** Lucide-shaped stroke icons for the console (stroke 2.2, 24×24). */
export const NAV_ICONS: Readonly<Record<NavHref, string>> = {
  '/': 'M3 11l9-8 9 8M5 10v10h14V10',
  '/tenants': 'M4 21V8l8-5 8 5v13M9 21v-6h6v6',
  '/uso': 'M4 20V10M10 20V4M16 20v-8M22 20H2',
  '/inbox': 'M22 12h-6l-2 3h-4l-2-3H2M5.5 5h13L22 12v7H2v-7z',
  '/flags': 'M5 22V4m0 0h11l-2 4 2 4H5',
  '/mapa': 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
  '/campanas': 'M3 11v2l13 5V6L3 11zm13-5 5-2v16l-5-2',
  '/capacidad':
    'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zm0 0v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
};

export const SEARCH_ICON = 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm9 2-3.5-3.5';

export function Icon({ d, size = 18 }: { readonly d: string; readonly size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
