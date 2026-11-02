/**
 * ChatWidget: "Ask my résumé". Answers come only from the local knowledge base in content.ts
 * (lib/kb.ts); anything it can't support gets the honest fallback. No network, no model.
 *
 * Motion: the panel grows from its launcher on the UI spring; the reply types in after a short
 * "thinking" beat. Reduced motion: the panel fades and replies appear whole.
 */
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { chat } from '../../content/content'
import { answer, type KbAnswer } from '../../lib/kb'
import { on } from '../../lib/bus'
import { usePrefs } from '../../hooks/prefs'
import { spring, transition } from '../../lib/motion'
import { typeText } from '../../lib/scramble'

interface Msg {
  id: number
  from: 'you' | 'bot'
  text: string
  link?: KbAnswer['link']
  typing?: boolean
}

let nextId = 1

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, from: 'bot', text: chat.intro }])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const { reduced } = usePrefs()
  const inputRef = useRef<HTMLInputElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const launcher = useRef<HTMLButtonElement>(null)
  const typingEl = useRef<HTMLSpanElement | null>(null)

  const ask = (q: string) => {
    const question = q.trim()
    if (!question || busy) return
    setDraft('')
    setBusy(true)
    const reply = answer(question)
    const id = nextId++
    setMsgs((m) => [...m, { id: nextId++, from: 'you', text: question }, { id, from: 'bot', text: reply.text, link: reply.link, typing: true }])
    window.setTimeout(
      () => {
        setMsgs((m) => m.map((x) => (x.id === id ? { ...x, typing: false } : x)))
        setBusy(false)
      },
      reduced ? 0 : 520,
    )
  }

  // Type the newest bot reply once its "thinking" beat ends.
  const last = msgs[msgs.length - 1]
  useEffect(() => {
    const el = typingEl.current
    if (!el || last.from !== 'bot' || last.typing || reduced) return
    return typeText(el, last.text, { cps: 220 })
  }, [last, reduced])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: reduced ? 'auto' : 'smooth' })
  }, [msgs, reduced])

  // The bus listener always calls the latest ask (it closes over busy).
  const askRef = useRef(ask)
  askRef.current = ask
  useEffect(
    () =>
      on('chat:open', (d) => {
        setOpen(true)
        if (d && 'question' in d && d.question) window.setTimeout(() => askRef.current(d.question!), 300)
      }),
    [],
  )

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 60)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        launcher.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const asked = msgs.some((x) => x.from === 'you')

  return (
    <div className="chat">
      <AnimatePresence>
        {open && (
          <m.section
            id="chat-panel"
            className="chat__panel"
            aria-label={chat.title}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 16 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0, transition: spring.ui }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8, transition: transition.exit }}
          >
            <header className="chat__head">
              <h2 className="chat__title">{chat.title}</h2>
              <button type="button" className="chat__close" onClick={() => setOpen(false)} aria-label="Close chat">
                Close
              </button>
            </header>

            <div ref={logRef} className="chat__log" role="log" aria-live="polite" aria-relevant="additions">
              {msgs.map((msg, i) => {
                const isLast = i === msgs.length - 1
                return (
                  <m.div
                    key={msg.id}
                    className="chat__msg"
                    data-from={msg.from}
                    initial={reduced ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={transition.ui}
                  >
                    {msg.typing ? (
                      <span className="chat__thinking" aria-label="Thinking">
                        <span />
                        <span />
                        <span />
                      </span>
                    ) : (
                      <p>
                        <span ref={isLast && msg.from === 'bot' ? typingEl : undefined}>{msg.text}</span>
                      </p>
                    )}
                    {!msg.typing && msg.link && (
                      <a
                        className="chat__link"
                        href={msg.link.href}
                        {...(msg.link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        {...(msg.link.href.endsWith('.pdf') ? { download: '' } : {})}
                      >
                        {msg.link.label}
                      </a>
                    )}
                  </m.div>
                )
              })}
              {!asked && (
                <ul className="chat__suggest" aria-label="Suggested questions">
                  {chat.suggestions.map((s) => (
                    <li key={s}>
                      <button type="button" className="chip chat__chip" onClick={() => ask(s)}>
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form
              className="chat__form"
              onSubmit={(e) => {
                e.preventDefault()
                ask(draft)
              }}
            >
              <label htmlFor="chat-input" className="visually-hidden">
                {chat.placeholder}
              </label>
              <input
                id="chat-input"
                ref={inputRef}
                className="chat__input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={chat.placeholder}
                autoComplete="off"
                maxLength={200}
              />
              <button type="submit" className="btn btn-primary chat__send" disabled={busy || !draft.trim()}>
                Ask
              </button>
            </form>
          </m.section>
        )}
      </AnimatePresence>

      <m.button
        ref={launcher}
        type="button"
        className="chat__launcher"
        aria-expanded={open}
        aria-controls="chat-panel"
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.95 }}
        transition={spring.press}
      >
        <span className="chat__launcher-mark" aria-hidden="true" />
        {open ? 'Close chat' : chat.title}
      </m.button>
    </div>
  )
}
