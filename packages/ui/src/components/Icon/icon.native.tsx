/**
 * Icon — React Native (Metro) variant.
 *
 * Metro auto-resolves this file when the mobile bundle imports
 * `./icon` (or anything that lands at `./icon.tsx` first). The web
 * default re-export in `./icon.tsx` never runs on RN because Metro
 * stops at `.native.tsx`.
 *
 * Mirrors `./icon.web.tsx` 1:1 but uses `lucide-react-native`, which
 * renders via `react-native-svg` primitives. Both packages are
 * **optional** peer deps of `@cachink/ui` — they are only required by
 * the mobile app bundle (`apps/mobile/package.json` adds them when the
 * mobile shell wires icons in; until then the import simply isn't
 * traversed because `apps/mobile` doesn't import `<Icon>` yet).
 *
 * The map below is identical in shape to the one in `./icon.web.tsx`
 * — adding a new `IconName` requires entries in both files.
 */
import type { ReactElement } from 'react';
import {
  Archive,
  Banknote,
  Bell,
  Building2,
  Cake,
  Calendar,
  Camera,
  ChartBar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  ClipboardList,
  Cloud,
  Coins,
  CreditCard,
  DollarSign,
  Ellipsis,
  Eye,
  EyeOff,
  FileText,
  HandCoins,
  HardDrive,
  Home,
  Info,
  LayoutDashboard,
  LayoutGrid,
  Minus,
  Monitor,
  Package,
  Pencil,
  Plug,
  Plus,
  Receipt,
  ScanBarcode,
  Search,
  Settings,
  Share2,
  ShoppingBag,
  Smartphone,
  Trash2,
  TrendingDown,
  TrendingUp,
  Truck,
  User,
  Users,
  Utensils,
  Wallet,
  X,
} from 'lucide-react-native';
import type { IconName, IconProps } from './icon.shared';
import { ICON_DEFAULT_SIZE, ICON_DEFAULT_STROKE } from './icon.shared';

export type IconElement = ReactElement;

const ICONS: Record<IconName, typeof Home> = {
  home: Home,
  'layout-dashboard': LayoutDashboard,
  'layout-grid': LayoutGrid,
  settings: Settings,
  ellipsis: Ellipsis,
  'dollar-sign': DollarSign,
  banknote: Banknote,
  wallet: Wallet,
  coins: Coins,
  'hand-coins': HandCoins,
  'credit-card': CreditCard,
  receipt: Receipt,
  archive: Archive,
  package: Package,
  'scan-barcode': ScanBarcode,
  'shopping-bag': ShoppingBag,
  'chart-bar': ChartBar,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  plus: Plus,
  minus: Minus,
  x: X,
  check: Check,
  'share-2': Share2,
  pencil: Pencil,
  'trash-2': Trash2,
  users: Users,
  user: User,
  bell: Bell,
  'circle-alert': CircleAlert,
  info: Info,
  'file-text': FileText,
  // Form affordances
  eye: Eye,
  'eye-off': EyeOff,
  camera: Camera,
  calendar: Calendar,
  search: Search,
  // Wizard / help-modal scenarios
  smartphone: Smartphone,
  'building-2': Building2,
  cake: Cake,
  truck: Truck,
  utensils: Utensils,
  'clipboard-list': ClipboardList,
  // Wizard step 2/2A/2B/3 mode-pickers
  'hard-drive': HardDrive,
  cloud: Cloud,
  plug: Plug,
  monitor: Monitor,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
};

export function Icon(props: IconProps): IconElement {
  const Glyph = ICONS[props.name];
  const size = props.size ?? ICON_DEFAULT_SIZE;
  const strokeWidth = props.strokeWidth ?? ICON_DEFAULT_STROKE;
  const color = props.color ?? 'currentColor';
  const decorative = props.ariaLabel === undefined;

  return (
    <Glyph
      testID={props.testID ?? `icon-${props.name}`}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      accessible={!decorative}
      accessibilityLabel={decorative ? undefined : props.ariaLabel}
      accessibilityRole={decorative ? undefined : 'image'}
    />
  );
}
