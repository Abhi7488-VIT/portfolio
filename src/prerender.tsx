/**
 * prerender.tsx: build-time render of the first screen (backdrop, nav, hero) to static HTML.
 * scripts/prerender.mjs injects it into dist/index.html so the name paints with the HTML,
 * before any JavaScript runs (fast FCP/LCP on phones). On load, React replaces it with the live
 * app, which renders the identical markup and then plays the boot.
 */
import { renderToString } from 'react-dom/server'
import { PrefsProvider } from './hooks/prefs'
import { Backdrop } from './components/Backdrop'
import { Nav } from './components/Nav'
import { Hero } from './sections/Hero'

export function render() {
  return renderToString(
    <PrefsProvider>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Backdrop />
      <Nav />
      <main id="main" className="relative z-[1]">
        <Hero />
        <div className="below-placeholder" aria-hidden="true" />
      </main>
    </PrefsProvider>,
  )
}
