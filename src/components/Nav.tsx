/**
 * Nav: corner chrome. Wordmark top-left; section links and system switches top-right.
 * Hides while scrolling down, returns on scroll up. Under 60rem the links move into a sheet
 * that wipes open from the menu button.
 */
import { useEffect, useRef, useState } from 'react'
import { sections, links, person } from '../content/content'
import { SystemToggles } from './SystemToggles'
import { Magnetic } from './Magnetic'
import { scrollToTarget, lockScroll } from '../lib/scroll'
import { emit, paletteShortcut } from '../lib/bus'

const navItems = sections.filter((s) => s.id !== 'hero')

export function Nav() {
  const [hidden, setHidden] = useState(false)
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string>('hero')
  // The sheet stays mounted while its closing wipe plays.
  const [mounted, setMounted] = useState(false)
  const [closing, setClosing] = useState(false)
  const menuBtn = useRef<HTMLButtonElement>(null)
  const sheet = useRef<HTMLDivElement>(null)

  // Direction-aware hide/show, throttled to animation frames.
  useEffect(() => {
    let last = window.scrollY
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        setSolid(y > 40)
        if (Math.abs(y - last) > 6) setHidden(y > last && y > 240)
        last = y
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Highlight the section in view (re-binds when the lazy sections mount).
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id))
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    const bind = () => {
      io.disconnect()
      sections.forEach((s) => {
        const el = document.getElementById(s.id)
        if (el) io.observe(el)
      })
    }
    bind()
    window.addEventListener('sections:ready', bind)
    return () => {
      io.disconnect()
      window.removeEventListener('sections:ready', bind)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setMounted(true)
      setClosing(false)
      return
    }
    if (!mounted) return
    setClosing(true)
    const t = window.setTimeout(() => {
      setMounted(false)
      setClosing(false)
    }, 480)
    return () => window.clearTimeout(t)
  }, [open, mounted])

  // Menu: lock scroll, close on Escape, return focus to the button.
  useEffect(() => {
    if (!open) return
    lockScroll(true)
    const first = sheet.current?.querySelector<HTMLElement>('a, button')
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key === 'Tab' && sheet.current) {
        const f = [...sheet.current.querySelectorAll<HTMLElement>('a, button')]
        const i = f.indexOf(document.activeElement as HTMLElement)
        if (e.shiftKey && i <= 0) {
          e.preventDefault()
          menuBtn.current?.focus()
        } else if (!e.shiftKey && i === f.length - 1) {
          e.preventDefault()
          menuBtn.current?.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      lockScroll(false)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setOpen(false)
    // Let the sheet start closing before the page moves.
    window.setTimeout(() => scrollToTarget(id), open ? 160 : 0)
  }

  return (
    <header className="nav" data-hidden={hidden && !open ? 'true' : undefined} data-solid={solid || undefined}>
      <div className="container nav__inner">
        <a href="#hero" onClick={go('hero')} className="wordmark" aria-label={`${person.name}, back to top`}>
          {person.initials}
        </a>

        <nav aria-label="Sections" className="nav__links">
          <ul role="list">
            {navItems.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} onClick={go(s.id)} className="nav__link" aria-current={active === s.id ? 'true' : undefined}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="nav__right">
          <button type="button" className="nav__palette readout" onClick={() => emit('palette:open')} aria-label={`Open command palette (${paletteShortcut()})`}>
            <kbd>{paletteShortcut()}</kbd>
          </button>
          <div className="nav__toggles">
            <SystemToggles />
          </div>
          <Magnetic className="nav__menu-wrap">
            <button
              ref={menuBtn}
              type="button"
              className="btn nav__menu"
              aria-expanded={open}
              aria-controls="menu-sheet"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? 'Close' : 'Menu'}
            </button>
          </Magnetic>
        </div>
      </div>

      {mounted && (
        <div id="menu-sheet" ref={sheet} className="menu-sheet" role="dialog" aria-modal="true" aria-label="Menu" data-closing={closing || undefined}>
          <ul role="list" className="menu-sheet__list">
            {navItems.map((s, i) => (
              <li key={s.id} style={{ ['--i' as string]: i }}>
                <a href={`#${s.id}`} onClick={go(s.id)} className="menu-sheet__link" aria-current={active === s.id ? 'true' : undefined}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="menu-sheet__foot">
            <SystemToggles />
            <button
              type="button"
              className="btn"
              onClick={() => {
                setOpen(false)
                window.setTimeout(() => emit('palette:open'), 200)
              }}
            >
              Command palette
            </button>
            <a className="btn" href={links.resume} download={links.resumeFileName}>
              Download résumé
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
