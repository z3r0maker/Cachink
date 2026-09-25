import { Hero } from './Hero.jsx';
import { Nav } from './Nav.jsx';
import { Ticker } from './Ticker.jsx';
import { structuredData } from '../src/structured-data.js';

/** Above the fold, plus the structured data. Everything below arrives as `children`. */
export function HomeShell({ children }) {
  return (
    <div className="xh">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Nav />
      <main id="main-content">
        <Hero />
        <Ticker />
        {children}
      </main>
    </div>
  );
}
