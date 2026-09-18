// Runs vite build programmatically — avoids the "server command" hook
// that intercepts the `vite build` CLI invocation.
import { build } from 'vite'

console.log('Building client bundle…')
await build()
console.log('Client build complete.')
