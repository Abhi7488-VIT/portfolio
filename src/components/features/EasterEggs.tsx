/**
 * EasterEggs: typed outside any field.
 *   "sudo hire abhishek"  confetti, a toast, then the contact section
 *   Konami code           "blueprint override": the grid charges up in the accent for ten seconds
 *   "status"              a system report toast
 * Plus a greeting in the browser console for anyone who opens DevTools.
 */
import { useEffect } from 'react'
import { easterEggs } from '../../content/content'
import { useToast } from '../Toast'
import { usePrefs } from '../../hooks/prefs'
import { scrollToTarget } from '../../lib/scroll'
import { confetti } from '../../lib/confetti'

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
let greeted = false

export function EasterEggs() {
  const { show } = useToast()
  const { reduced } = usePrefs()

  useEffect(() => {
    if (!greeted) {
      greeted = true
      console.log(
        '%cAK console%c\nBuilt with React, GSAP, Lenis and a 2D canvas.\nTry typing  sudo hire abhishek  anywhere on the page.',
        'font: 700 14px monospace; padding: 4px 0',
        'font: 12px monospace',
      )
    }
    let typed = ''
    let keys: string[] = []
    let overrideTimer: number | undefined

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [contenteditable="true"]') || e.metaKey || e.ctrlKey || e.altKey) return

      keys = [...keys, e.key.length === 1 ? e.key.toLowerCase() : e.key].slice(-KONAMI.length)
      if (keys.join() === KONAMI.join()) {
        keys = []
        document.documentElement.classList.add('override-grid')
        show(easterEggs.konamiToast, { tone: 'info', ms: 3200 })
        window.clearTimeout(overrideTimer)
        overrideTimer = window.setTimeout(() => document.documentElement.classList.remove('override-grid'), 10000)
        return
      }

      if (e.key.length !== 1) return
      typed = (typed + e.key.toLowerCase()).slice(-40)
      if (typed.endsWith(easterEggs.sudoPhrase)) {
        typed = ''
        if (!reduced) confetti()
        show(easterEggs.sudoToast, { ms: 3000 })
        window.setTimeout(() => scrollToTarget('contact'), reduced ? 200 : 900)
      } else if (typed.endsWith(easterEggs.statusPhrase)) {
        typed = ''
        show(easterEggs.statusToast, { tone: 'info' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(overrideTimer)
      document.documentElement.classList.remove('override-grid')
    }
  }, [show, reduced])

  return null
}
