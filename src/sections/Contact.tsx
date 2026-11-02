/**
 * Contact: the one thing this site wants a visitor to do.
 *  - Copy-email button with toast feedback (clipboard API, with a mailto fallback).
 *  - A real form posting to Formspree. While FORMSPREE_FORM_ID is the placeholder, the form says
 *    plainly that it is not connected and sends nothing (no fake success).
 *  - LinkedIn, GitHub and the résumé download.
 */
import { useRef, useState } from 'react'
import { contact, links, FORMSPREE_FORM_ID } from '../content/content'
import { SectionTitle } from '../components/SectionTitle'
import { Magnetic } from '../components/Magnetic'
import { useToast } from '../components/Toast'
import { useReveal } from '../hooks/useReveal'

type State = 'idle' | 'sending' | 'sent' | 'error' | 'not-wired'
const wired = FORMSPREE_FORM_ID !== 'YOUR_FORMSPREE_ID' && FORMSPREE_FORM_ID.trim() !== ''

export function Contact() {
  const root = useRef<HTMLElement>(null)
  const form = useRef<HTMLFormElement>(null)
  const [state, setState] = useState<State>('idle')
  const { show } = useToast()
  useReveal(root)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(links.email)
      show(contact.copiedToast)
    } catch {
      window.location.href = links.mailto
    }
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = e.currentTarget
    if (!f.checkValidity()) {
      f.reportValidity()
      ;(f.querySelector(':invalid') as HTMLElement | null)?.focus()
      return
    }
    if (!wired) {
      setState('not-wired')
      return
    }
    setState('sending')
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_FORM_ID}`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(f),
      })
      if (!res.ok) throw new Error(String(res.status))
      setState('sent')
      f.reset()
    } catch {
      setState('error')
    }
  }

  const message =
    state === 'sent' ? contact.form.success : state === 'error' ? contact.form.error : state === 'not-wired' ? contact.form.notWired : ''

  return (
    <section id="contact" ref={root} className="contact section" aria-labelledby="contact-title">
      <div className="container contact__grid">
        <div className="contact__lead">
          <SectionTitle id="contact-title" text={contact.heading} className="contact__title" />
          <p className="contact__lede" data-reveal="rise">
            {contact.lede}
          </p>
          <div className="contact__email" data-reveal="rise">
            <a className="contact__address" href={links.mailto}>
              {links.email}
            </a>
            <Magnetic>
              <button type="button" className="btn btn-primary" onClick={copyEmail}>
                {contact.copyLabel}
              </button>
            </Magnetic>
          </div>
          <ul className="contact__links" data-reveal="rise">
            <li>
              <a className="link" href={links.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn<span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            </li>
            <li>
              <a className="link" href={links.github} target="_blank" rel="noopener noreferrer">
                GitHub<span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            </li>
            <li>
              <a className="link" href={links.resume} download={links.resumeFileName}>
                Résumé PDF
              </a>
            </li>
          </ul>
        </div>

        <form
          ref={form}
          className="contact__form"
          onSubmit={onSubmit}
          noValidate
          data-endpoint={wired ? `https://formspree.io/f/${FORMSPREE_FORM_ID}` : ''}
          data-reveal="rise"
          aria-describedby="form-status"
        >
          <div className="field">
            <label htmlFor="cf-name">{contact.form.nameLabel}</label>
            <input id="cf-name" name="name" type="text" autoComplete="name" required />
          </div>
          <div className="field">
            <label htmlFor="cf-email">{contact.form.emailLabel}</label>
            <input id="cf-email" name="email" type="email" autoComplete="email" inputMode="email" required />
          </div>
          <div className="field">
            <label htmlFor="cf-message">{contact.form.messageLabel}</label>
            <textarea id="cf-message" name="message" rows={5} required />
          </div>
          <div className="contact__submit">
            <button type="submit" className="btn" disabled={state === 'sending'}>
              {state === 'sending' ? contact.form.sending : contact.form.submit}
            </button>
            <p id="form-status" className="contact__status" role="status" data-state={state}>
              {message}
            </p>
          </div>
        </form>
      </div>
    </section>
  )
}
