/**
 * prefs.tsx: theme (console / blueprint) and motion mode (full / reduced).
 *
 * Motion: follows the OS `prefers-reduced-motion` until the visitor flips the on-page toggle, after
 * which their explicit choice wins and is remembered. Reduced mode keeps the design and swaps
 * travel for fades; components read `reduced` and pick their fade variant.
 *
 * Theme: swapped through the View Transitions API as a circular wipe from the toggle. Without the API
 * (or in reduced mode) it falls back to a short cross-fade of the colour tokens.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { ease } from '../lib/motion'

export type Theme = 'dark' | 'light'
export type MotionMode = 'full' | 'reduced'

interface Prefs {
  theme: Theme
  reduced: boolean
  motionSource: 'system' | 'user'
  toggleTheme: (origin?: { x: number; y: number }) => void
  setMotion: (mode: MotionMode) => void
}

const PrefsContext = createContext<Prefs | null>(null)

const THEME_KEY = 'ak-theme'
const MOTION_KEY = 'ak-motion'
const THEME_COLOR: Record<Theme, string> = { dark: '#0b0f0a', light: '#eaf1f8' }

const read = (key: string) => {
  if (typeof localStorage === 'undefined') return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* private mode: preference just won't persist */
  }
}

const systemReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark',
  )
  const [userMotion, setUserMotion] = useState<MotionMode | null>(() => {
    const m = read(MOTION_KEY)
    return m === 'full' || m === 'reduced' ? m : null
  })
  const [sysReduced, setSysReduced] = useState(systemReduced)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setSysReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const reduced = userMotion ? userMotion === 'reduced' : sysReduced

  // Reflect state on <html> so CSS can react without React.
  useEffect(() => {
    const d = document.documentElement
    d.setAttribute('data-theme', theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
  }, [theme])

  useEffect(() => {
    const d = document.documentElement
    if (userMotion) d.setAttribute('data-motion', userMotion)
    else d.removeAttribute('data-motion')
    d.classList.toggle('reduced-motion', reduced)
  }, [userMotion, reduced])

  const toggleTheme = useCallback(
    (origin?: { x: number; y: number }) => {
      const next: Theme = theme === 'dark' ? 'light' : 'dark'
      const apply = () => {
        flushSync(() => setTheme(next))
        write(THEME_KEY, next)
      }
      const doc = document as Document & {
        startViewTransition?: (cb: () => void) => { ready: Promise<void> }
      }
      if (!doc.startViewTransition) {
        apply()
        return
      }
      const root = document.documentElement
      root.classList.add('theme-switching')
      const vt = doc.startViewTransition(apply)
      if (reduced) {
        vt.ready.finally(() => setTimeout(() => root.classList.remove('theme-switching'), 300))
        return
      }
      const x = origin?.x ?? window.innerWidth - 40
      const y = origin?.y ?? 40
      const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
      vt.ready
        .then(() => {
          const anim = root.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
            {
              duration: 760,
              easing: `cubic-bezier(${ease.inOut.join(',')})`,
              pseudoElement: '::view-transition-new(root)',
            },
          )
          anim.finished.finally(() => root.classList.remove('theme-switching'))
        })
        .catch(() => root.classList.remove('theme-switching'))
    },
    [theme, reduced],
  )

  const setMotion = useCallback((mode: MotionMode) => {
    setUserMotion(mode)
    write(MOTION_KEY, mode)
  }, [])

  const value = useMemo<Prefs>(
    () => ({ theme, reduced, motionSource: userMotion ? 'user' : 'system', toggleTheme, setMotion }),
    [theme, reduced, userMotion, toggleTheme, setMotion],
  )

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
}

export function usePrefs() {
  const ctx = useContext(PrefsContext)
  if (!ctx) throw new Error('usePrefs must be used inside <PrefsProvider>')
  return ctx
}
