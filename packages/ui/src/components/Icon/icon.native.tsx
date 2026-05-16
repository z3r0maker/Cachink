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
  Apple,
  Archive,
  Armchair,
  ArrowDownUp,
  Banknote,
  Bath,
  Beef,
  Beer,
  Bell,
  Book,
  Box,
  Briefcase,
  Building2,
  Cake,
  Calendar,
  Camera,
  Candy,
  Car,
  ChartBar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleHelp,
  CircleX,
  ClipboardList,
  Cloud,
  Coffee,
  Coins,
  Cookie,
  CreditCard,
  Croissant,
  CupSoda,
  DollarSign,
  Droplets,
  Drumstick,
  Egg,
  Ellipsis,
  Eye,
  EyeOff,
  FileText,
  Fish,
  Flower2,
  Gem,
  Gift,
  GlassWater,
  Grape,
  Hammer,
  HandCoins,
  HardDrive,
  HardHat,
  Heart,
  Home,
  IceCreamCone,
  Inbox,
  Info,
  Lamp,
  Landmark,
  LayoutDashboard,
  LayoutGrid,
  Leaf,
  Lock,
  Martini,
  Milk,
  Minus,
  Monitor,
  Music,
  Nut,
  Package,
  Paintbrush,
  Palette,
  PawPrint,
  Pencil,
  PenTool,
  Pill,
  Pizza,
  Plug,
  Plus,
  Popcorn,
  Printer,
  Receipt,
  RefreshCw,
  Salad,
  Sandwich,
  ScanBarcode,
  Scissors,
  Search,
  Settings,
  Share2,
  Shirt,
  SportShoe,
  ShoppingBag,
  ShoppingCart,
  Sliders,
  Smartphone,
  Soup,
  Sparkles,
  SprayCan,
  Star,
  Stethoscope,
  Store,
  Sun,
  Tag,
  Ticket,
  Trash2,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Trophy,
  Truck,
  User,
  UserCheck,
  Users,
  Utensils,
  Wallet,
  Watch,
  Wine,
  Wrench,
  X,
  Zap,
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
  'shopping-cart': ShoppingCart,
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
  'user-check': UserCheck,
  bell: Bell,
  'circle-alert': CircleAlert,
  'circle-help': CircleHelp,
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
  // Feature flags + system modules (Phase 4)
  inbox: Inbox,
  'refresh-cw': RefreshCw,
  zap: Zap,
  sliders: Sliders,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  // Caja Completa
  landmark: Landmark,
  'arrow-down-up': ArrowDownUp,
  'circle-x': CircleX,
  lock: Lock,
  'triangle-alert': TriangleAlert,
  // Product icons — Alimentos
  beef: Beef,
  apple: Apple,
  candy: Candy,
  cookie: Cookie,
  croissant: Croissant,
  drumstick: Drumstick,
  egg: Egg,
  fish: Fish,
  'ice-cream-cone': IceCreamCone,
  leaf: Leaf,
  nut: Nut,
  pizza: Pizza,
  popcorn: Popcorn,
  salad: Salad,
  sandwich: Sandwich,
  soup: Soup,
  // Product icons — Bebidas
  beer: Beer,
  coffee: Coffee,
  'cup-soda': CupSoda,
  'glass-water': GlassWater,
  grape: Grape,
  martini: Martini,
  milk: Milk,
  wine: Wine,
  // Product icons — Comercio
  gift: Gift,
  gem: Gem,
  shirt: Shirt,
  'sport-shoe': SportShoe,
  store: Store,
  tag: Tag,
  watch: Watch,
  // Product icons — Servicios
  car: Car,
  hammer: Hammer,
  'hard-hat': HardHat,
  paintbrush: Paintbrush,
  scissors: Scissors,
  'spray-can': SprayCan,
  stethoscope: Stethoscope,
  wrench: Wrench,
  // Product icons — Belleza & Cuidado
  bath: Bath,
  sparkles: Sparkles,
  sun: Sun,
  droplets: Droplets,
  heart: Heart,
  // Product icons — Hogar & Oficina
  armchair: Armchair,
  book: Book,
  briefcase: Briefcase,
  lamp: Lamp,
  'pen-tool': PenTool,
  printer: Printer,
  // Product icons — General
  box: Box,
  'flower-2': Flower2,
  music: Music,
  palette: Palette,
  'paw-print': PawPrint,
  pill: Pill,
  star: Star,
  ticket: Ticket,
  trophy: Trophy,
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
