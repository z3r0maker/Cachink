/**
 * Dev-only utilities barrel.
 *
 * All exports are guarded by `__DEV__` at the component level. Demo seeding
 * was archived with the first-run wizard (A-05): an activated device gets
 * its data from the portal, and E2E runs use the mock API instead.
 */

export { ResetDemoAction, type ResetDemoActionProps } from './reset-demo-action';
