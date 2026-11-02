/**
 * CommandPalette (Ctrl/Cmd + K): jump to sections, open projects and their links, switch theme or
 * motion, download the résumé, copy the email, ask the résumé chat.
 *
 * Accessible combobox + listbox: arrows move, Enter runs, Escape closes, focus returns to where it
 * came from. Opens on the UI spring; results stagger in.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { sections, projects, links, palette } from '../../content/content'
import { usePrefs } from '../../hooks/prefs'
import { useToast } from '../Toast'
import { scrollToTarget, lockScroll } from '../../lib/scroll'
import { emit, on, paletteShortcut } from '../../lib/bus'
import { spring, transition, stagger } from '../../lib/motion'

interface Command {
  id: string
  group: 'Go to' | 'Projects' | 'Actions' | 'Links'
  label: string
  hint?: string
  keywords?: string
  run: () => void
}

/** Subsequence fuzzy score: higher is better, -1 means no match. */
function score(query: string, text: string) {
  if (!query) return 0
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  const at = t.indexOf(q)
  if (at >= 0) return 100 - at
  let ti = 0
  let s = 0
  for (const ch of q) {
    const i = t.indexOf(ch, ti)
    if (i < 0) return -1
    s += i === ti ? 3 : 1
    ti = i + 1
  }
  return s
}

const openTab = (href: string) => window.open(href, '_blank', 'noopener,noreferrer')

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)
  const { toggleTheme, theme, reduced, setMotion } = usePrefs()
  const { show } = useToast()

  const commands = useMemo<Command[]>(() => {
    const go: Command[] = sections.map((s) => ({
      id: `go-${s.id}`,
      group: 'Go to',
      label: s.label === 'Boot' ? 'Top of the page' : s.label,
      hint: s.stage,
      keywords: s.id,
      run: () => scrollToTarget(s.id),
    }))
    const proj: Command[] = projects.flatMap((p) => {
      const out: Command[] = [
        { id: `case-${p.id}`, group: 'Projects', label: `${p.name} case study`, hint: p.date, keywords: p.stack.join(' '), run: () => scrollToTarget(`project-${p.id}`) },
      ]
      if (p.demo) out.push({ id: `demo-${p.id}`, group: 'Projects', label: `${p.name} live demo`, hint: 'new tab', run: () => openTab(p.demo!) })
      out.push({ id: `repo-${p.id}`, group: 'Projects', label: `${p.name} on GitHub`, hint: 'new tab', run: () => openTab(p.repo) })
      return out
    })
    const actions: Command[] = [
      { id: 'theme', group: 'Actions', label: theme === 'dark' ? 'Switch to blueprint theme' : 'Switch to console theme', keywords: 'light dark mode', run: () => toggleTheme() },
      { id: 'motion', group: 'Actions', label: reduced ? 'Turn full motion on' : 'Reduce motion', keywords: 'animation accessibility', run: () => setMotion(reduced ? 'full' : 'reduced') },
      {
        id: 'resume',
        group: 'Actions',
        label: 'Download résumé',
        hint: 'PDF',
        keywords: 'resume cv',
        run: () => {
          const a = document.createElement('a')
          a.href = links.resume
          a.download = links.resumeFileName
          a.click()
        },
      },
      {
        id: 'copy',
        group: 'Actions',
        label: 'Copy email address',
        keywords: 'contact mail',
        run: () =>
          navigator.clipboard
            .writeText(links.email)
            .then(() => show('Email copied to clipboard'))
            .catch(() => (window.location.href = links.mailto)),
      },
      { id: 'chat', group: 'Actions', label: 'Ask my résumé', keywords: 'chat question', run: () => emit('chat:open') },
    ]
    const ext: Command[] = [
      { id: 'linkedin', group: 'Links', label: 'LinkedIn', hint: 'new tab', run: () => openTab(links.linkedin) },
      { id: 'github', group: 'Links', label: 'GitHub profile', hint: 'new tab', run: () => openTab(links.github) },
      { id: 'email', group: 'Links', label: 'Write an email', hint: links.email, run: () => (window.location.href = links.mailto) },
    ]
    return [...go, ...proj, ...actions, ...ext]
  }, [theme, reduced, toggleTheme, setMotion, show])

  const results = useMemo(() => {
    if (!query.trim()) return commands
    return commands
      .map((c) => ({ c, s: Math.max(score(query, c.label), score(query, `${c.keywords ?? ''} ${c.group}`) - 10) }))
      .filter((r) => r.s >= 0)
      .sort((a, b) => b.s - a.s)
      .map((r) => r.c)
  }, [commands, query])

  // Global shortcut and bus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    const offOpen = on('palette:open', () => setOpen(true))
    const offToggle = on('palette:toggle', () => setOpen((o) => !o))
    return () => {
      window.removeEventListener('keydown', onKey)
      offOpen()
      offToggle()
    }
  }, [])

  useEffect(() => {
    if (open) {
      returnTo.current = document.activeElement as HTMLElement
      lockScroll(true)
      setQuery('')
      setIndex(0)
      requestAnimationFrame(() => input.current?.focus())
    } else {
      lockScroll(false)
      returnTo.current?.focus?.()
    }
  }, [open])

  useEffect(() => setIndex(0), [query])

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [index])

  const run = (c: Command | undefined) => {
    if (!c) return
    setOpen(false)
    // Let the dialog close (and focus return) before the action moves the page.
    window.setTimeout(c.run, 120)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndex((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndex((i) => Math.max(0, i - 1))
    } else if (e.key === 'Home') {
      setIndex(0)
    } else if (e.key === 'End') {
      setIndex(results.length - 1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(results[index])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    } else if (e.key === 'Tab') {
      e.preventDefault() // the input is the only stop inside the dialog
    }
  }

  let lastGroup = ''
  return (
    <AnimatePresence>
      {open && (
        <m.div className="palette-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition.ui} onMouseDown={() => setOpen(false)}>
          <m.div
            className="palette"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: spring.ui }}
            exit={{ opacity: 0, y: -8, scale: 0.98, transition: transition.exit }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="palette__bar">
              <span className="palette__prompt readout" aria-hidden="true">
                &gt;
              </span>
              <input
                ref={input}
                className="palette__input"
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-list"
                aria-activedescendant={results[index] ? `cmd-${results[index].id}` : undefined}
                aria-autocomplete="list"
                aria-label="Command"
                placeholder={palette.placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                spellCheck={false}
                autoComplete="off"
              />
              <kbd className="palette__kbd readout">Esc</kbd>
            </div>
            <ul ref={list} id="palette-list" className="palette__list" role="listbox" aria-label="Commands">
              {results.length === 0 && <li className="palette__empty">{palette.empty}</li>}
              {results.map((c, i) => {
                const head = c.group !== lastGroup && !query.trim()
                lastGroup = c.group
                return (
                  <m.li
                    key={c.id}
                    id={`cmd-${c.id}`}
                    role="option"
                    aria-selected={i === index}
                    data-index={i}
                    className="palette__item"
                    data-head={head ? c.group : undefined}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...transition.ui, delay: Math.min(i, 12) * (stagger.char * 0.8) }}
                    onMouseMove={() => setIndex(i)}
                    onClick={() => run(c)}
                  >
                    <span className="palette__label">{c.label}</span>
                    {c.hint && <span className="palette__hint readout">{c.hint}</span>}
                  </m.li>
                )
              })}
            </ul>
            <p className="palette__foot readout">
              <span>↑ ↓ to move</span>
              <span>Enter to run</span>
              <span>{paletteShortcut()} to toggle</span>
            </p>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
