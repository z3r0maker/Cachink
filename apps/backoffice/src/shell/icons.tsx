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
  '/empresa/movimientos': 'M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3',
  '/empresa/socios':
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.1a4 4 0 0 1 0 7.8M22 21v-1a6 6 0 0 0-4-5.6',
  '/empresa/agenda':
    'M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM8 12h3M8 16h6',
  '/empresa/expediente':
    'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zM3 10h18',
  '/empresa/corporativo': 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M9 10h.01M15 10h.01',
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
