import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import '../colors_and_type.css'
import './global.css'

// We use createRoot (not hydrateRoot) so the prerendered HTML is visible to
// crawlers but React takes full ownership in the browser — no hydration
// mismatch risk from viewport-dependent inline styles.
createRoot(document.getElementById('root')).render(<App />)
