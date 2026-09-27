/**
 * Barrel for all reusable components in `@xangarro/ui`.
 *
 * Every new component gets one line here: `export * from './<Name>/index';`.
 * Both `apps/mobile` and `apps/desktop` import by name from `@xangarro/ui`
 * (via `.` entry) or from `@xangarro/ui/components` (this file).
 */
export * from './Btn/index';
export * from './Input/index';
export * from './Tag/index';
export * from './Modal/index';
export * from './EmptyState/index';
export * from './SectionTitle/index';
export * from './Card/index';
export * from './BottomTabBar/index';
export * from './TopBar/index';
export * from './Scanner/index';
export * from './Icon/index';
export * from './Don/index';
export * from './RoleIllustration/index';
export * from './SegmentedToggle/index';
export * from './Combobox/index';
export * from './ConfirmDialog/index';
export * from './ErrorState/index';
export * from './FAB/index';
export * from './List/index';
export * from './SearchBar/index';
export * from './Skeleton/index';
export * from './SplitPane/index';
export * from './SwipeableRow/index';
export * from './SwipeableTabView/index';
export * from './SafeAreaSpacer/index';
export * from './fields/index';
export * from './ProductoCard/index';
export * from './ProductoCardGrid/index';
export * from './FloatingCoinsBackground/index';
export * from './ActivityTracker/index';
export * from './PinCodeInput/index';
export * from './OptionCardGroup/index';
export * from './Spinner/index';
export * from './LoadingOverlay/index';
export * from './SaleBurst/index';
// NOTE: AppShellRouteWrapper is NOT re-exported here. It lives in
// components/ but imports from screens/AppShell, which imports from
// components/ — creating a require cycle. It's re-exported from
// screens/index.ts instead (both end up in the top-level barrel).
