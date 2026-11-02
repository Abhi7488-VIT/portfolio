/**
 * Footer: an inverted field (ink becomes the ground) with the email address as the headline.
 * In the console theme it's a pale slab; in blueprint it's the prussian sheet.
 */
import { links, footer, person } from '../content/content'
import { scrollToTarget } from '../lib/scroll'

export function Footer() {
  const [user, domain] = links.email.split('@')
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__top">
          <p className="footer__note">{footer.availability}</p>
          <p className="footer__note readout">{person.location}</p>
          <a
            className="footer__top-link link"
            href="#hero"
            onClick={(e) => {
              e.preventDefault()
              scrollToTarget('hero')
            }}
          >
            {footer.backToTop}
          </a>
        </div>

        <a className="footer__email display" href={links.mailto}>
          <span>{user}</span>
          <span className="footer__at">@{domain}</span>
        </a>

        <div className="footer__bottom">
          <ul className="footer__links">
            <li>
              <a className="link" href={links.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
            </li>
            <li>
              <a className="link" href={links.github} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </li>
            <li>
              <a className="link" href={links.resume} download={links.resumeFileName}>
                Résumé
              </a>
            </li>
          </ul>
          <p>{footer.note}</p>
          <p className="readout">{new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  )
}
