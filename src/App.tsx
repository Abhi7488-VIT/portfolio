/**
 * App shell: preferences, the shared motion loop, smooth scroll, chrome and sections.
 * Sections below the hero are added stage by stage (and lazy-loaded once they exist).
 */
import { lazy, Suspense, useEffect, useState } from 'react'
import { PrefsProvider, usePrefs } from './hooks/prefs'
import { setupGsap } from './lib/gsap'
import { startSmoothScroll, stopSmoothScroll } from './lib/scroll'
import { startPerfGovernor } from './lib/perf'
import { Backdrop } from './components/Backdrop'
import { Cursor } from './components/Cursor'
import { Nav } from './components/Nav'
import { Hero } from './sections/Hero'
import { ToastProvider } from './components/Toast'
import { Footer } from './components/Footer'

const Below = lazy(() => import('./sections/Below'))
const Features = lazy(() => import('./components/features/Features'))

setupGsap()

function Shell() {
  const { reduced } = usePrefs()

  // Smooth scroll only with full motion; reduced mode keeps native scrolling.
  useEffect(() => {
    if (reduced) {
      stopSmoothScroll()
      return
    }
    startSmoothScroll()
    return () => stopSmoothScroll()
  }, [reduced])

  useEffect(() => {
    startPerfGovernor()
  }, [])

  // The wow layer (palette, chat, pipeline dock, easter eggs) mounts once the page is idle.
  const [featuresReady, setFeaturesReady] = useState(false)
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }
    const go = () => setFeaturesReady(true)
    if (w.requestIdleCallback) w.requestIdleCallback(go, { timeout: 1800 })
    else window.setTimeout(go, 1200)
  }, [])

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Backdrop />
      <Nav />
      <main id="main" className="relative z-[1]">
        <Hero />
        <Suspense fallback={<div className="below-placeholder" aria-hidden="true" />}>
          <Below />
        </Suspense>
      </main>
      <Footer />
      {featuresReady && (
        <Suspense fallback={null}>
          <Features />
        </Suspense>
      )}
      <Cursor />
    </>
  )
}

export default function App() {
  return (
    <PrefsProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </PrefsProvider>
  )
}
